"""
 File: project/serializers.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: DRF serializers for the project.
"""


from rest_framework import serializers
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.authtoken.models import Token
from .models import *


class ProfileSerializer(serializers.ModelSerializer):
    # for setting default account based on all of the account objects 
    default_account = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        allow_null=True,
        required=False,
    )

    def validate_default_account(self, value):
        """checks that the default account belongs to the signed in user"""
        if value is None:
            return value
        request = self.context.get("request")
        user = getattr(request, "user", None) # use getattr so that we can default if None
        if user and value.user_id != user.id:
            raise serializers.ValidationError("Default account must belong to the current user.")
        return value

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "fixed_income",
            "savings_goal",
            "default_account",
        ]
        read_only_fields = ["id", "user"]

    def create(self, validated_data):
        """creates a profile and syncs dependent category goals"""
        profile = super().create(validated_data)
        CategorySerializer._sync_other_goal(profile.user, profile)
        return profile

    def update(self, instance, validated_data):
        profile = super().update(instance, validated_data)
        CategorySerializer._sync_other_goal(profile.user, profile)
        return profile


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "user", "name", "kind"]
        read_only_fields = ["id", "user"]


class CategorySerializer(serializers.ModelSerializer):
    PROTECTED_CATEGORY_NAMES = {"income", "other"}

    @staticmethod
    def _available_for_spending(user, profile):
        """figures out how much spending budget is available this month"""
        today = timezone.localdate()
        month_income_received = (
            Transaction.objects.filter(
                user=user,
                transaction_type=Transaction.TransactionType.RECEIVED,
                date__year=today.year,
                date__month=today.month,
                category__name__iexact="income",
            )
            .exclude(account__kind__iexact=Account.AccountKind.SAVINGS)
            .aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )
        effective_income = profile.fixed_income + month_income_received
        return effective_income - profile.savings_goal

    @classmethod
    def _sync_other_goal(cls, user, profile):
        """updates other so category goals still fit the available budget"""
        
        other = Category.objects.filter(user=user, name__iexact="other").first()
        if other is None:
            return
        available_for_spending = cls._available_for_spending(user, profile)
        allocated_without_other = (
            Category.objects.filter(user=user)
            .exclude(name__iexact="income")
            .exclude(name__iexact="other")
            .aggregate(total=Sum("spend_goal"))["total"]
            or Decimal("0.00")
        )
        other_goal = available_for_spending - allocated_without_other
        if other_goal < Decimal("0.00"):
            other_goal = Decimal("0.00")
        if (other.spend_goal or Decimal("0.00")) != other_goal:
            other.spend_goal = other_goal
            other.save(update_fields=["spend_goal"])

    def validate(self, attrs):
        """validates category names and goals against the user budget"""

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return attrs

        try:
            profile = user.budget_profile
        except Profile.DoesNotExist:
            raise serializers.ValidationError(
                {"spend_goal": "Set savings goal before setting category goals."}
            )

        available_for_spending = self._available_for_spending(user, profile)
        if available_for_spending < 0:
            raise serializers.ValidationError(
                {"spend_goal": "Savings goal cannot exceed available monthly income."}
            )

        requested_name = attrs.get("name", self.instance.name if self.instance else "").strip()
        requested_name_lower = requested_name.lower()
        is_income_category = requested_name_lower == "income"
        requested_goal = attrs.get(
            "spend_goal",
            self.instance.spend_goal if self.instance and self.instance.spend_goal is not None else Decimal("0.00"),
        )
        requested_goal = requested_goal or Decimal("0.00")
        if is_income_category and requested_goal > Decimal("0.00"):
            raise serializers.ValidationError(
                {"spend_goal": 'Income category should not have a positive spend goal.'}
            )

        queryset = Category.objects.filter(user=user)
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if requested_name and queryset.filter(name__iexact=requested_name).exists():
            raise serializers.ValidationError(
                {"name": "You already have a category with this name."}
            )

        # takes all transactions except for income and other
        locked_allocated = (
            queryset.exclude(name__iexact="income")
            .exclude(name__iexact="other")
            .aggregate(total=Sum("spend_goal"))["total"]
            or Decimal("0.00")
        )
        # this is the pool of what is remaining to be allocated
        potential_to_allocate = available_for_spending - locked_allocated
        if potential_to_allocate < Decimal("0.00"):
            potential_to_allocate = Decimal("0.00")

        # return an error if we are trying to go over our budget when editing
        if requested_goal > potential_to_allocate and requested_goal > Decimal("0.00"):
            raise serializers.ValidationError(
                {
                    "spend_goal": (
                        "Category spend goals exceed available spending budget. "
                        f"Available: {available_for_spending:.2f}, "
                        f"already allocated: {locked_allocated:.2f}, "
                        f"remaining: {potential_to_allocate:.2f}."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        """creates a category then syncs other when needed"""
        category = super().create(validated_data)
        name = (category.name or "").strip().lower()
        if name not in self.PROTECTED_CATEGORY_NAMES:
            profile = category.user.budget_profile
            self._sync_other_goal(category.user, profile)
        return category

    def update(self, instance, validated_data):
        """updates a category then syncs other when needed"""
        category = super().update(instance, validated_data)
        name = (category.name or "").strip().lower()
        if name not in self.PROTECTED_CATEGORY_NAMES:
            profile = category.user.budget_profile
            self._sync_other_goal(category.user, profile)
        return category

    class Meta:
        model = Category
        fields = ["id", "user", "name", "need_or_want", "spend_goal"]
        read_only_fields = ["id", "user"]


# class FixedExpenseSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = FixedExpense
#         fields = ["id", "user", "category", "label", "amount", "frequency", "due_date"]
#         read_only_fields = ["id", "user"]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "user",
            "account",
            "category",
            "transaction_type",
            "amount",
            "date",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)
    fixed_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    savings_goal = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_username(self, value):
        """makes sure the username is not already taken"""
        User = get_user_model()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate(self, attrs):
        """checks signup values like income and savings goal"""
        fixed_income = attrs["fixed_income"]
        savings_goal = attrs["savings_goal"]
        if fixed_income <= 0:
            raise serializers.ValidationError({"fixed_income": "Fixed income must be greater than 0."})
        if savings_goal < 0:
            raise serializers.ValidationError({"savings_goal": "Savings goal cannot be negative."})
        return attrs

    # annotation ensures that this create sequence is all or nothing in our database
    # the A in ACID; we dont want a Profile object created if user object creation failed
    @transaction.atomic
    def create(self, validated_data):
        """creates user, profile, defaults, and returns auth token payload"""
        User = get_user_model()
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        Profile.objects.create(
            user=user,
            fixed_income=validated_data["fixed_income"],
            savings_goal=validated_data["savings_goal"],
        )
        Category.objects.create(
            user=user,
            name="Income",
            need_or_want=Category.NeedOrWant.WANT,
            spend_goal=Decimal("0.00"),
        )
        Category.objects.create(
            user=user,
            name="Other",
            need_or_want=Category.NeedOrWant.WANT,
            spend_goal=Decimal("0.00"),
        )
        # use DRF tokens for auth
        token, _ = Token.objects.get_or_create(user=user)
        return {"token": token.key, "user_id": user.id, "username": user.username}
