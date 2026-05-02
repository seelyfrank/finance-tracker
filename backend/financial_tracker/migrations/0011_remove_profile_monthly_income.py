from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0010_drop_stale_account_opening_balance_column"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="monthly_income",
        ),
    ]
