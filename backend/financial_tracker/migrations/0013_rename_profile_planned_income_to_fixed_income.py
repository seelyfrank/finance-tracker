from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0012_add_profile_planned_income"),
    ]

    operations = [
        migrations.RenameField(
            model_name="profile",
            old_name="planned_income",
            new_name="fixed_income",
        ),
    ]
