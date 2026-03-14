from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_farmercertification'),
    ]

    operations = [
        migrations.AddField(
            model_name='farmercertification',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='farmercertification',
            name='issued_by',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='farmercertification',
            name='issued_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='farmerprofile',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=40, null=True),
        ),
    ]
