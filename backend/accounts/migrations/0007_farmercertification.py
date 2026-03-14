from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_remove_passwordresettoken_token_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='FarmerCertification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('certificate_image', models.ImageField(upload_to='farmer/certifications/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('farmer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certifications', to='accounts.farmerprofile')),
            ],
        ),
    ]
