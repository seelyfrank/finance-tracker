from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0011_remove_profile_monthly_income"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="planned_income",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
            preserve_default=False,
        ),
    ]
