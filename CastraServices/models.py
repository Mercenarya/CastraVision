from django.conf import settings
from django.db import models
from pgvector.django import VectorField


class KnowledgeChunk(models.Model):
    class Source(models.TextChoices):
        META = "meta", "Meta"
        GOOGLE_ADS = "google_ads", "Google Ads"
        TIKTOK = "tiktok", "TikTok"
        ENTERPRISE = "enterprise", "Enterprise"
        HISTORICAL = "historical", "Historical"

    source = models.CharField(max_length=32, choices=Source.choices)
    external_id = models.CharField(max_length=160)
    title = models.CharField(max_length=255)
    content = models.TextField()
    content_hash = models.CharField(max_length=64, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    embedded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["source", "external_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"], name="unique_knowledge_chunk"
            )
        ]

    def __str__(self) -> str:
        return f"{self.source}:{self.external_id}"


class BusinessAccount(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_account",
    )
    business_name = models.CharField(max_length=120)
    industry = models.CharField(max_length=120)
    business_size = models.CharField(max_length=20)
    target_customers = models.TextField(max_length=500)
    primary_goal = models.CharField(max_length=300, blank=True)
    product_service = models.CharField(max_length=500, blank=True)
    preferred_channels = models.JSONField(default=list, blank=True)
    monthly_budget = models.PositiveBigIntegerField(default=0)
    currency = models.CharField(max_length=3, default="VND")
    updated_at = models.DateTimeField(auto_now=True)


class CampaignImport(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="campaign_imports",
    )
    filename = models.CharField(max_length=255)
    row_count = models.PositiveIntegerField()
    normalized_rows = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
