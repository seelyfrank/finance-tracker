from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(Transaction)
admin.site.register(Profile)
admin.site.register(Account)
# admin.site.register(FixedExpense)
admin.site.register(Category)