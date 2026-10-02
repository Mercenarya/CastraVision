from django.contrib import admin

from .models import KnowledgeChunk


@admin.register(KnowledgeChunk)
class KnowledgeChunkAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "external_id", "embedded_at", "updated_at")
    list_filter = ("source",)
    search_fields = ("title", "content", "external_id")
    readonly_fields = ("content_hash", "embedded_at", "created_at", "updated_at")


# Register your models here.
