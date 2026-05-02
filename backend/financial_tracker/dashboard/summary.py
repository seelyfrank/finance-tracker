"""
 File: project/dashboard/summary.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: Builds dashboard summary metrics and upcoming scheduled payments
 lists from queryset and profile data for the REST API response.
"""


from decimal import Decimal
from django.db.models import Q, Sum
from financial_tracker.models import Category
from financial_tracker.dashboard.calculations import (
    percent_of_income,
)


def build_future_payments(all_user_transactions, now):
    """collects upcoming payments after the current day"""

    future_transactions_qs = (
        all_user_transactions
        .filter(date__gt=now.date())
        .select_related("category")
        .order_by("date", "id")
    )
    # extract information for future payments, accounting for sent versus recieved
    future_payments = []
    for txn in future_transactions_qs:
        signed_amount = txn.amount if txn.transaction_type == "sent" else -txn.amount
        future_payments.append(
            {
                "id": txn.id,
                "date": txn.date,
                "category_name": txn.category.name,
                "net_effect": signed_amount,
            }
        )
    return future_payments


def build_summary_data(*,
                       queryset,
                       projected_daily_avg_sent,
                       profile,
                       user,
                       days_in_month: int,
                       now):
    """builds all dashboard summary numbers for the current month"""

    today = now.date()

    # we dont want added savings this month to be spent
    spendable_queryset = queryset.exclude(account__kind__iexact="savings")
    
    # all sent transactions up to today with a total
    completed_transactions_net = (
        spendable_queryset.filter(
            date__lte=today,
            transaction_type="sent",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    # all scheduled transaction to be sent
    scheduled_transactions_net = (
        spendable_queryset.filter(
            date__gt=today,
            transaction_type="sent",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    # total sent for the entire period
    period_sent_total = (
        spendable_queryset.filter(transaction_type="sent").aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    # find how much we made from the special Income category
    actual_income_for_period = (
        spendable_queryset.filter(
            transaction_type="received",
            category__name__iexact="income",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    # we define the period income as the fixed_income plus whatever else
    # we marked as the income category
    period_income = profile.fixed_income + actual_income_for_period
    period_savings_goal = profile.savings_goal
    
    # how much did we put into the savings
    savings_account_received_for_period = (
        queryset.filter(
            account__kind__iexact="savings",
            transaction_type="received",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    # how much did we take out of savings
    savings_account_sent_for_period = (
        queryset.filter(
            account__kind__iexact="savings",
            transaction_type="sent",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    # the difference
    savings_account_net_for_period = (
        savings_account_received_for_period - savings_account_sent_for_period
    )

    # determine the total planned sum of the needs and 
    # wants since its not an explicit field in my models
    monthly_needs_goal = (
        Category.objects.filter(
            user=user,
            need_or_want=Category.NeedOrWant.NEED,
        )
        .exclude(name__iexact="income") # we dont want to include income here
        .aggregate(total=Sum("spend_goal"))["total"]
        or Decimal("0.00")
    )
    monthly_wants_goal = (
        Category.objects.filter(
            user=user,
            need_or_want=Category.NeedOrWant.WANT,
        )
        .exclude(name__iexact="income") # same logic
        .aggregate(total=Sum("spend_goal"))["total"]
        or Decimal("0.00")
    )

    # get the specific amounts spent for this period (queryset will only contain transactions for the period)
    needs_spent_for_period = (
        spendable_queryset.filter(
            category__need_or_want=Category.NeedOrWant.NEED,
            transaction_type="sent",
        )
        .exclude(category__name__iexact="income")
        .aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    wants_spent_for_period = (
        spendable_queryset.filter(
            category__need_or_want=Category.NeedOrWant.WANT,
            transaction_type="sent",
        )
        .exclude(category__name__iexact="income")
        .aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    # get the total sent for the entire month (consistent sent-only spending basis)
    # i keep this line here because before I was doing multiple periods instead of just month
    # but only keeping month happened to work out better
    month_total_sent = period_sent_total

    days_left_including_today = max(days_in_month - today.day + 1, 1)

    # find the spendable queryset before today for calculating reccomendations
    spendable_before_today = spendable_queryset.filter(date__lt=today)
    before_today_sent = (
        spendable_before_today.filter(transaction_type="sent").aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    before_today_income_received = (
        spendable_before_today.filter(
            transaction_type="received",
            category__name__iexact="income",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    before_today_effective_income = profile.fixed_income + before_today_income_received
    
    # make sure we account for transactions that must be sent in the future
    scheduled_needed_sent = ( 
        spendable_queryset.filter(
            date__gt=today,
            category__need_or_want=Category.NeedOrWant.NEED,
            transaction_type="sent",
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    # use all of that information to determine up to todays point, what can we actually spend
    # in our wants without going over savings goal, using money from needed scheduled payments,
    # and of course including what was already spent this month
    allocated_remaining_before_today = (
        before_today_effective_income
        - profile.savings_goal
        - before_today_sent
        - scheduled_needed_sent
    )
    # freeze month remaining at start-of-day so pacing target stays stable for the day
    allocated_spending_remaining = allocated_remaining_before_today
    # determines how much we can spend today
    daily_target_base = allocated_remaining_before_today / Decimal(days_left_including_today)
    # determines what was already spent
    today_spendable_sent = (
        spendable_queryset.filter(date=today, transaction_type="sent").aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )
    live_left_today = daily_target_base - today_spendable_sent

    # calculate projected spending based on the amount of days left in the month
    # and recent spending
    days_after_today_in_month = max(days_in_month - today.day, 0)
    projected_for_period = month_total_sent + (
        projected_daily_avg_sent * days_after_today_in_month
    )
    projected_savings_amount = (
        period_income
        + savings_account_net_for_period
        - projected_for_period
    )

    # determine what we are actually saving at the moment
    total_spent_for_period = period_sent_total
    actual_savings_amount = (
        period_income
        + savings_account_net_for_period
        - total_spent_for_period
    )

    # convert to percentages
    actual_savings_percent_of_income = percent_of_income(actual_savings_amount, period_income)
    needs_percent_of_income = percent_of_income(needs_spent_for_period, period_income)
    wants_percent_of_income = percent_of_income(wants_spent_for_period, period_income)
    needs_goal_percent_of_income = percent_of_income(monthly_needs_goal, period_income)
    wants_goal_percent_of_income = percent_of_income(monthly_wants_goal, period_income)
    savings_goal_percent_of_income = percent_of_income(period_savings_goal, period_income)

    # split month net across all accounts
    by_account_qs = (
        queryset
        .values("account_id", "account__name")
        .annotate(
            sent_amount=Sum("amount", filter=Q(transaction_type="sent")),
            received_amount=Sum("amount", filter=Q(transaction_type="received")),
        )
    )
    # build list of account spending for each account
    by_account = []
    for row in by_account_qs:
        amount = (row["sent_amount"] or Decimal("0.00")) - (row["received_amount"] or Decimal("0.00"))
        pct = (amount / total_spent_for_period * 100) if total_spent_for_period else Decimal("0")
        by_account.append(
            {
                "account_id": row["account_id"],
                "account_name": row["account__name"],
                "amount": amount,
                "percent_of_total": pct,
            }
        )
    by_account.sort(key=lambda row: row["amount"], reverse=True) # sort desc

    # same exact process for categories
    by_category_qs = (
        spendable_queryset
        .values("category_id", "category__name")
        .annotate(
            sent_amount=Sum("amount", filter=Q(transaction_type="sent")),
            received_amount=Sum("amount", filter=Q(transaction_type="received")),
        )
    )
    by_category = []
    has_income_row = False
    for row in by_category_qs:
        category_name = row["category__name"] or ""
        # account for special income category potential errors
        is_income_category = category_name.strip().lower() == "income"
        if is_income_category:
            has_income_row = True
            income_received_for_row = row["received_amount"] or Decimal("0.00")
            income_total_for_row = profile.fixed_income + income_received_for_row
            amount = (row["sent_amount"] or Decimal("0.00")) - income_total_for_row
        else:
            amount = (row["sent_amount"] or Decimal("0.00")) - (row["received_amount"] or Decimal("0.00"))
        if amount == Decimal("0.00"):
            continue
        pct = (amount / period_sent_total * 100) if period_sent_total else Decimal("0")
        by_category.append(
            {
                "category_id": row["category_id"],
                "category_name": category_name,
                "amount": amount,
                "percent_of_total": pct,
            }
        )
    if not has_income_row and period_income > Decimal("0.00"):
        income_category = Category.objects.filter(user=user, name__iexact="income").first()
        if income_category is not None:
            income_total_for_row = profile.fixed_income + actual_income_for_period
            amount = Decimal("0.00") - income_total_for_row
            pct = (amount / period_sent_total * 100) if period_sent_total else Decimal("0")
            by_category.append(
                {
                    "category_id": income_category.id,
                    "category_name": income_category.name,
                    "amount": amount,
                    "percent_of_total": pct,
                }
            )
    by_category.sort(key=lambda row: row["amount"], reverse=True)

    return {
        "total_spent": period_sent_total,
        "completed_transactions_net": completed_transactions_net,
        "scheduled_transactions_net": scheduled_transactions_net,
        "allocated_spending_remaining": allocated_spending_remaining,
        "left_to_spend_today": live_left_today,
        "daily_target_base": daily_target_base,
        "live_left_today": live_left_today,
        "projected_for_period": projected_for_period,
        "projected_savings_amount": projected_savings_amount,
        "period_income": period_income,
        "needs_spent": needs_spent_for_period,
        "wants_spent": wants_spent_for_period,
        "actual_savings_amount": actual_savings_amount,
        "actual_savings_percent_of_income": actual_savings_percent_of_income,
        "needs_percent_of_income": needs_percent_of_income,
        "wants_percent_of_income": wants_percent_of_income,
        "needs_goal_amount": monthly_needs_goal,
        "wants_goal_amount": monthly_wants_goal,
        "savings_goal_amount": period_savings_goal,
        "needs_goal_percent_of_income": needs_goal_percent_of_income,
        "wants_goal_percent_of_income": wants_goal_percent_of_income,
        "savings_goal_percent_of_income": savings_goal_percent_of_income,
        "agg_by_account": by_account,
        "agg_by_category": by_category,
    }
