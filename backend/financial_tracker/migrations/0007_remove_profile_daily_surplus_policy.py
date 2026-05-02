from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0006_profile_default_account"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="daily_surplus_policy",
        ),
    ]
