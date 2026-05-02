"""
 File: project/views.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: Django REST Framework API views including auth registration/login,
 authenticated CRUD, and dashboard analytics using the dashboard helpers.
"""


from decimal import Decimal
from datetime import timedelta
import calendar

from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.contrib.auth import authenticate
from rest_framework import generics, status, serializers
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import Profile

from .models import *
from .serializers import *

# imported from module we made
from .dashboard import (
    build_future_payments,
    build_summary_data,
)


class RegisterAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        """registers a new user and returns auth info"""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(result, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """Handles login flow with error handling using `status` from DRF """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        """authenticates a user and returns a token"""
        username = request.data.get("username", "")
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"detail": "Both username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request=request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user_id": user.id, "username": user.username},
            status=status.HTTP_200_OK,
        )

class UserOwnedListCreateAPIView(generics.ListCreateAPIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """limits list/create queryset to the current user"""
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """forces created objects to be owned by the current user"""
        serializer.save(user=self.request.user)


class UserOwnedDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """limits detail actions to objects owned by current user"""
        return self.queryset.filter(user=self.request.user)


class ProfileListCreateAPIView(UserOwnedListCreateAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()


class ProfileDetailAPIView(UserOwnedDetailAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()


class AccountListCreateAPIView(UserOwnedListCreateAPIView):
    serializer_class = AccountSerializer
    queryset = Account.objects.all()


class AccountDetailAPIView(UserOwnedDetailAPIView):
    serializer_class = AccountSerializer
    queryset = Account.objects.all()


class CategoryListCreateAPIView(UserOwnedListCreateAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

    @staticmethod
    def _ensure_default_categories(user):
        """makes sure income and other default categories exist"""
        defaults = (
            ("Income", Category.NeedOrWant.WANT, Decimal("0.00")),
            ("Other", Category.NeedOrWant.WANT, Decimal("0.00")),
        )
        for name, need_or_want, spend_goal in defaults:
            Category.objects.get_or_create(
                user=user,
                name=name,
                defaults={
                    "need_or_want": need_or_want,
                    "spend_goal": spend_goal,
                },
            )

    def get_queryset(self):
        """loads category list and keeps default goals in sync"""
        self._ensure_default_categories(self.request.user)
        try:
            profile = self.request.user.budget_profile
        except Profile.DoesNotExist:
            profile = None
        if profile is not None:
            CategorySerializer._sync_other_goal(self.request.user, profile)
        return super().get_queryset()


class CategoryDetailAPIView(UserOwnedDetailAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

    def perform_update(self, serializer):
        """updates non-protected categories and resyncs other goal"""
        instance = self.get_object()
        if (instance.name or "").strip().lower() in {"income", "other"}:
            raise serializers.ValidationError(
                {"detail": "Income and Other are default categories and cannot be edited."}
            )
        updated = serializer.save()
        try:
            profile = updated.user.budget_profile
        except Profile.DoesNotExist:
            return
        # updates the goal for the other category depending on what
        # the user adjusted the current category to
        CategorySerializer._sync_other_goal(updated.user, profile)

    def perform_destroy(self, instance):
        """deletes non-protected categories and resyncs other goal"""
        if (instance.name or "").strip().lower() in {"income", "other"}:
            raise serializers.ValidationError(
                {"detail": "Income and Other are default categories and cannot be deleted."}
            )
        user = instance.user
        super().perform_destroy(instance)
        try:
            profile = user.budget_profile
        except Profile.DoesNotExist:
            return
        CategorySerializer._sync_other_goal(user, profile)

# NOTE: see FixedExpense model

# class FixedExpenseListCreateAPIView(UserOwnedListCreateAPIView):
#     serializer_class = FixedExpenseSerializer
#     queryset = FixedExpense.objects.all()


# class FixedExpenseDetailAPIView(UserOwnedDetailAPIView):
#     serializer_class = FixedExpenseSerializer
#     queryset = FixedExpense.objects.all()


class TransactionPagination(PageNumberPagination):
    """We can use a custom pagination class in the following API view to define
    how large we want our pages and what to refer them as in our GETs"""


    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class TransactionListCreateAPIView(UserOwnedListCreateAPIView):
    serializer_class = TransactionSerializer
    queryset = Transaction.objects.all()
    pagination_class = TransactionPagination

    def get_queryset(self):
        """builds filtered transaction queryset from query params"""
        qs = Transaction.objects.filter(user=self.request.user)
        parameters = self.request.query_params
        category = parameters.get("category")

        if category is not None and str(category).strip() != "":
            try:
                qs = qs.filter(category_id=int(category))
            except (TypeError, ValueError): # saftey check
                pass

        account = parameters.get("account")
        if account is not None and str(account).strip() != "":
            try:
                qs = qs.filter(account_id=int(account))
            except (TypeError, ValueError): # saftey check
                pass

        transaction_type = parameters.get("transaction_type")
        if transaction_type in ("sent", "received"):
            qs = qs.filter(transaction_type=transaction_type)

        from_date = parameters.get("date_from")
        if from_date is not None and str(from_date).strip() != "":
            date = parse_date(str(from_date).strip())
            if date is not None:
                qs = qs.filter(date__gte=date)

        to_date = parameters.get("date_to")
        if to_date is not None and str(to_date).strip() != "":
            date = parse_date(str(to_date).strip())
            if date is not None:
                qs = qs.filter(date__lte=date)
        return qs.order_by("-date", "-id") # dec

    # static method is just used like in OOP when a method belongs to the class namespace
    # and doesn't need an object reference (also since its jsut a helper)
    @staticmethod 
    def _format_money(value) -> str:
        """formats decimals as simple money strings"""
        v = value if value is not None else Decimal("0.00")
        return f"{v:.2f}"

    def list(self, request, *args, **kwargs):
        """returns paginated transactions plus totals for the full filter"""

        queryset = self.filter_queryset(self.get_queryset())
        sent_total = (
            queryset.filter(transaction_type=Transaction.TransactionType.SENT)
            .aggregate(s=Sum("amount"))["s"]
            or Decimal("0.00")
        )
        received_total = (
            queryset.filter(transaction_type=Transaction.TransactionType.RECEIVED)
            .aggregate(s=Sum("amount"))["s"]
            or Decimal("0.00")
        )
        filter_net = received_total - sent_total
        extra = {
            "filter_total_sent": self._format_money(sent_total),
            "filter_total_received": self._format_money(received_total),
            "filter_net": self._format_money(filter_net),
        }

        page = self.paginate_queryset(queryset)
        assert page is not None

        serializer = self.get_serializer(page, many=True)
        paginated_response = self.get_paginated_response(serializer.data)
        paginated_response.data.update(extra)
        return paginated_response

class TransactionDetailAPIView(UserOwnedDetailAPIView):
    serializer_class = TransactionSerializer
    queryset = Transaction.objects.all()

class DashboardAnalyticsView(APIView):
    """The main meat of my project. Handles all data required to view the dashboard
    Relies on helper module in the .dashboard/ directory"""

    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """returns dashboard summary metrics and future payments"""
        user = request.user

        # profile creation will be enforced at registration, but just in case.
        try:
            profile = user.budget_profile
        except Profile.DoesNotExist:
            return Response(
                { "detail": "Profile not found." },
                status=status.HTTP_404_NOT_FOUND
            )

        # get time information using local timezone date boundaries
        now = timezone.localtime(timezone.now())
        today = timezone.localdate()
        year = today.year
        month = today.month
        days_in_month = calendar.monthrange(year, month)[1]

        all_user_transactions = Transaction.objects.filter(user=user)
        
        # month user transactions from 1-last day of month; used for main analysis
        month_user_transactions = all_user_transactions.filter(date__month=month, date__year=year)
        
        most_recent_week_transactions = all_user_transactions.filter(
            date__gte=today - timedelta(days=6),
            date__lte=today,
        )
        # filter by sent transactions only to get spending habit
        sent_last_7 = (
            most_recent_week_transactions.filter(
                transaction_type=Transaction.TransactionType.SENT,
            ).exclude(
                account__kind__iexact=Account.AccountKind.SAVINGS
            ).aggregate(
                s=Sum("amount")
            )["s"]
            or Decimal("0.00")
        )
        # used as input to our sumamary function to get projected spending and savings
        projected_daily_avg_sent = sent_last_7 / Decimal("7")

        # using helper
        future_payments = build_future_payments(
            all_user_transactions=all_user_transactions,
            now=now,
        )

        # the main data source
        month_data = build_summary_data(
            queryset=month_user_transactions,
            projected_daily_avg_sent=projected_daily_avg_sent,
            profile=profile,
            user=user,
            days_in_month=days_in_month,
            now=now,
        )
        # I had daily and weekly calculations before which is why I refer to a lot
        # as period rather then everying as month, but I removed it as the insights
        # weren't as useful as using the entire month for projections
        month_projected = month_data["projected_for_period"]
        if not isinstance(month_projected, Decimal): # type check
            month_projected = Decimal(str(month_projected))
        # determines UI change if our projected spending eats into the savings goal
        month_income = month_data.get("period_income", Decimal("0.00"))
        if not isinstance(month_income, Decimal):
            month_income = Decimal(str(month_income))
        show_warning = (month_income - month_projected) < profile.savings_goal
        month_data["show_warning"] = show_warning

        data = {
            "month_data": month_data,
            "future_payments": future_payments,
        }

        return Response(data)
            
            