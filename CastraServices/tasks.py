from celery import shared_task
from django.utils import timezone

from .models import KnowledgeChunk
from .rag import get_embedding_provider


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 3},
)
def embed_pending_chunks(limit: int = 100) -> int:
    rows = list(KnowledgeChunk.objects.filter(embedding__isnull=True)[:limit])
    if not rows:
        return 0
    provider = get_embedding_provider()
    embeddings = provider.embed_many([row.content for row in rows])
    for row, embedding in zip(rows, embeddings, strict=True):
        row.embedding = embedding
        row.embedded_at = timezone.now()
        row.metadata = {**row.metadata, "embedding_provider": provider.name}
    KnowledgeChunk.objects.bulk_update(rows, ["embedding", "embedded_at", "metadata"])
    return len(rows)
