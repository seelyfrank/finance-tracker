from django.db import migrations


def drop_opening_balance_if_exists(apps, schema_editor):
    table_name = "project_account"
    column_name = "opening_balance"

    with schema_editor.connection.cursor() as cursor:
        columns = [
            row[1]
            for row in cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
        ]
        if column_name in columns:
            cursor.execute(f"ALTER TABLE {table_name} DROP COLUMN {column_name};")


def add_opening_balance_if_missing(apps, schema_editor):
    table_name = "project_account"
    column_name = "opening_balance"

    with schema_editor.connection.cursor() as cursor:
        columns = [
            row[1]
            for row in cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
        ]
        if column_name not in columns:
            cursor.execute(
                f"ALTER TABLE {table_name} "
                "ADD COLUMN opening_balance decimal NOT NULL DEFAULT 0;"
            )


class Migration(migrations.Migration):

    dependencies = [
        ("project", "0009_alter_profile_monthly_income"),
    ]

    operations = [
        migrations.RunPython(
            drop_opening_balance_if_exists,
            reverse_code=add_opening_balance_if_missing,
        ),
    ]
