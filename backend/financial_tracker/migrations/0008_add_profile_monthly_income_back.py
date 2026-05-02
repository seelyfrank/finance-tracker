from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0007_remove_profile_daily_surplus_policy"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="monthly_income",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
