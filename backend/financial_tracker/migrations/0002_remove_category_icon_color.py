from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("project", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="category",
            name="color",
        ),
        migrations.RemoveField(
            model_name="category",
            name="icon",
        ),
    ]
