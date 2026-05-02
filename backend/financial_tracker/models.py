"""
 File: project/models.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: Django models for profiles, linked accounts/categories,
 and typed transactions.
"""


from django.conf import settings
from django.db import models
from django.utils import timezone


class Profile(models.Model):
    """Model to represent a user profile"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # connects to the user model in django auth
        on_delete=models.CASCADE,
        related_name="budget_profile",
    )
    fixed_income = models.DecimalField(max_digits=12, decimal_places=2)
    savings_goal = models.DecimalField(max_digits=12, decimal_places=2)
    default_account = models.ForeignKey( # used to autofill transaction for good UX
        "Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_for_profiles",
    )
    def __str__(self):
        return f"Profile({self.user_id})"


class Account(models.Model):
    """Represents the funding source for each transaction"""

    class AccountKind(models.TextChoices):
        """TextChoices is a way to represent various options rather than just representing as strings
        almost like an enum. The first string is how we store the value and the second string is for display"""
        
        CHECKING = "checking", "Checking and Debit"
        SAVINGS = "savings", "Savings"
        CREDIT = "credit", "Credit card"
        CASH = "cash", "Cash"
        OTHER = "other", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budget_accounts",
    )
    name = models.CharField(max_length=120)  # name on the account

    # uses our choices class to reporesent the "kind" of account
    kind = models.CharField( 
        max_length=20,
        choices=AccountKind.choices,
        default=AccountKind.CHECKING,
    )

    def __str__(self) -> str:
        """returns account name plus kind for display"""
        return f"{self.name} ({self.get_kind_display()})"


class Category(models.Model):

    # this subclass is good for determining required purchases to allocate space for versus
    # things that dont matter as much (useful for prediction how much we can spend each day)
    class NeedOrWant(models.TextChoices):
        NEED = "need", "Need"
        WANT = "want", "Want"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budget_categories",
    )
    name = models.CharField(max_length=100)
    need_or_want = models.CharField(
        max_length=10,
        choices=NeedOrWant.choices,
        default=NeedOrWant.WANT,
    )
    
    # the spend goal will be derived from the user settings, related to their income and
    # planned spending breakdown
    spend_goal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        """returns the category name"""
        return self.name

# NOTE: not using FixedExpense at the moment, but may incorperate it in the future if I have time
# For transactions that are made reoccuring, the user must schedule each one, HOWEVER
# this is possible using the Transaction model by scheduling the date to the future
# which will also adjust the projected budget analytics

# class FixedExpense(models.Model):
#     """This class is necessary for reoccuring costs like rent, subscriptions, utilities, etc.
#     We store it in its own model so that the user does not to input these costs each month
#     as they would for other transactions. They can set a freq and day which it gets spent
#     which will automatically deduct that amount at that time"""


#     class Frequency(models.TextChoices):
#         """Another enum type subclass"""

#         WEEKLY = "weekly", "Weekly"
#         MONTHLY = "monthly", "Monthly"

#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name="budget_fixed_expenses",
#     )
#     category = models.ForeignKey(
#         Category,
#         on_delete=models.CASCADE,
#         related_name="fixed_expenses",
#     )
#     account = models.ForeignKey(
#         Account,
#         on_delete=models.CASCADE
#         related_name="fixed_expenses"
#     )
#     last_generated = models.DateField(null=True, blank=True)
#     is_active = models.BooleanField(default=True)
#     label = models.CharField(max_length=120)
#     amount = models.DecimalField(max_digits=12, decimal_places=2)
#     frequency = models.CharField(
#         max_length=10,
#         choices=Frequency.choices,
#         default=Frequency.MONTHLY,
#     )
#     due_date = models.PositiveSmallIntegerField(
#         help_text="Day of month (1–31).",
#     )

#     def __str__(self) -> str:
#         return f"{self.label} ({self.get_frequency_display()})"


class Transaction(models.Model):
    """Represents each individual transaction made by a user"""

    class TransactionType(models.TextChoices):
        """Will determine the sign of the arithmetic (add or subtract they payment)"""
        SENT = "sent", "Sent"
        RECEIVED = "received", "Received"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budget_transactions",
    )
    # determines which account this transaction will hit
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.localdate)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """returns a readable summary of the transaction"""
        return f"{self.get_transaction_type_display()} {self.amount} on {self.date}"