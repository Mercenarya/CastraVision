from django.db import migrations, models
import pgvector.django.vector


def create_vector_extension(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("CREATE EXTENSION IF NOT EXISTS vector")


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.RunPython(create_vector_extension, migrations.RunPython.noop),
        migrations.CreateModel(
            name="KnowledgeChunk",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source", models.CharField(choices=[("meta", "Meta"), ("google_ads", "Google Ads"), ("tiktok", "TikTok"), ("enterprise", "Enterprise"), ("historical", "Historical")], max_length=32)),
                ("external_id", models.CharField(max_length=160)),
                ("title", models.CharField(max_length=255)),
                ("content", models.TextField()),
                ("content_hash", models.CharField(db_index=True, max_length=64)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("embedding", pgvector.django.vector.VectorField(blank=True, dimensions=1536, null=True)),
                ("embedded_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["source", "external_id"],
                "constraints": [models.UniqueConstraint(fields=("source", "external_id"), name="unique_knowledge_chunk")],
            },
        ),
    ]

