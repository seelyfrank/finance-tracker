"""
 File: project/urls.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: URL patterns mapping paths to REST API views
"""

from django.urls import path

from .views import *

urlpatterns = [
    path("api/register/", RegisterAPIView.as_view(), name="api_register"),
    path("api/login/", LoginAPIView.as_view(), name="api_login"),
    path("api/profiles", ProfileListCreateAPIView.as_view(), name="api_profiles"),
    path("api/profile/<int:pk>", ProfileDetailAPIView.as_view(), name="api_profile"),
    path("api/accounts", AccountListCreateAPIView.as_view(), name="api_accounts"),
    path("api/account/<int:pk>", AccountDetailAPIView.as_view(), name="api_account"),
    path("api/categories", CategoryListCreateAPIView.as_view(), name="api_categories"),
    path("api/category/<int:pk>", CategoryDetailAPIView.as_view(), name="api_category"),
    # path("api/fixed_expenses", FixedExpenseListCreateAPIView.as_view(), name="api_fixed_expenses"),
    # path("api/fixed_expense/<int:pk>", FixedExpenseDetailAPIView.as_view(), name="api_fixed_expense"),
    path("api/transactions", TransactionListCreateAPIView.as_view(), name="api_transactions"),
    path("api/transaction/<int:pk>", TransactionDetailAPIView.as_view(), name="api_transaction"),
    path("api/dashboard/", DashboardAnalyticsView.as_view(), name="project-dashboard-analytics"),
]
