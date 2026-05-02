"""
 File: project/dashboard/calculations.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: Helper aggregates for dashboard analytics
"""


from decimal import Decimal
from django.db.models import Q, Sum

from financial_tracker.models import Category


def get_net_amount(queryset):
    """gets net spend by subtracting received from sent"""
    sent_total = queryset.filter(transaction_type="sent").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
    received_total = queryset.filter(transaction_type="received").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
    return sent_total - received_total


def get_category_breakdown(queryset):
    """builds category totals with net spend per category"""
    
    category_qs = (
        queryset
        .values("category_id", "category__name") # double underscore means we follow through a relation like doing category.name
        .annotate( # add the total sent and recieved to the queryset for next computation
            sent_amount=Sum("amount", filter=Q(transaction_type="sent")),
            received_amount=Sum("amount", filter=Q(transaction_type="received")),
        )
    )
    breakdown = []
    for row in category_qs:
        amount = (row["sent_amount"] or Decimal("0.00")) - (row["received_amount"] or Decimal("0.00"))
        breakdown.append( # use the new amount computation to build the lists
            {
                "category_id": row["category_id"],
                "category_name": row["category__name"], 
                "net_spent": amount,
            }
        )
    breakdown.sort(key=lambda row: row["net_spent"], reverse=True) # sort descending
    return breakdown


def percent_of_income(part: Decimal, income: Decimal):
    """turns a value into percent of income"""
    return (part / income * Decimal("100")) if income else Decimal("0")
