import hashlib
import math
import re
from dataclasses import dataclass
from typing import Protocol

from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone
from openai import OpenAI
from pgvector.django import CosineDistance

from .models import KnowledgeChunk

EMBEDDING_DIMENSIONS = 1536


class EmbeddingProvider(Protocol):
    name: str

    def embed_many(self, texts: list[str]) -> list[list[float]]: ...


class OpenAIEmbeddingProvider:
    name = "openai"

    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for OpenAI embeddings")
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        response = self.client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=[text.replace("\n", " ") for text in texts],
            encoding_format="float",
        )
        return [item.embedding for item in response.data]


class LocalHashEmbeddingProvider:
    """Deterministic offline embedding used for Sprint 1 development and tests."""

    name = "local-hash"

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    @staticmethod
    def _embed(text: str) -> list[float]:
        vector = [0.0] * EMBEDDING_DIMENSIONS
        tokens = re.findall(r"[\wÀ-ỹ]+", text.casefold())
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % EMBEDDING_DIMENSIONS
            vector[index] += 1.0 if digest[4] % 2 == 0 else -1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]


def get_embedding_provider() -> EmbeddingProvider:
    configured = settings.EMBEDDING_PROVIDER.casefold()
    if configured == "openai" or (configured == "auto" and settings.OPENAI_API_KEY):
        return OpenAIEmbeddingProvider()
    return LocalHashEmbeddingProvider()


def chunk_text(text: str, max_chars: int = 1400, overlap_chars: int = 180) -> list[str]:
    cleaned = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if not cleaned:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + max_chars, len(cleaned))
        if end < len(cleaned):
            boundary = cleaned.rfind(" ", start, end)
            if boundary > start + max_chars // 2:
                end = boundary
        chunks.append(cleaned[start:end].strip())
        if end >= len(cleaned):
            break
        start = max(end - overlap_chars, start + 1)
    return chunks


def ingest_document(
    *, source: str, external_id: str, title: str, content: str, metadata: dict | None = None
) -> int:
    chunks = chunk_text(content)
    if not chunks:
        return 0
    provider = get_embedding_provider()
    embeddings = provider.embed_many(chunks)
    keep_ids: list[str] = []
    now = timezone.now()
    with transaction.atomic():
        for index, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
            chunk_id = f"{external_id}:{index}"
            keep_ids.append(chunk_id)
            digest = hashlib.sha256(chunk.encode("utf-8")).hexdigest()
            KnowledgeChunk.objects.update_or_create(
                source=source,
                external_id=chunk_id,
                defaults={
                    "title": title,
                    "content": chunk,
                    "content_hash": digest,
                    "metadata": {**(metadata or {}), "embedding_provider": provider.name},
                    "embedding": embedding,
                    "embedded_at": now,
                },
            )
        KnowledgeChunk.objects.filter(
            source=source, external_id__startswith=f"{external_id}:"
        ).exclude(external_id__in=keep_ids).delete()
    return len(chunks)


@dataclass(frozen=True)
class SearchResult:
    source: str
    title: str
    content: str
    score: float


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    numerator = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    return numerator / (left_norm * right_norm) if left_norm and right_norm else 0.0


def search_knowledge(query: str, top_k: int | None = None) -> list[SearchResult]:
    limit = max(1, min(top_k or settings.RAG_TOP_K, 20))
    provider = get_embedding_provider()
    query_embedding = provider.embed_many([query])[0]
    queryset = KnowledgeChunk.objects.exclude(embedding__isnull=True).filter(
        metadata__embedding_provider=provider.name
    )

    if connection.vendor == "postgresql":
        rows = queryset.annotate(distance=CosineDistance("embedding", query_embedding)).order_by(
            "distance"
        )[:limit]
        return [
            SearchResult(
                source=row.source,
                title=row.title,
                content=row.content,
                score=max(-1.0, min(1.0, 1.0 - float(row.distance))),
            )
            for row in rows
        ]

    ranked = sorted(
        (
            SearchResult(
                source=row.source,
                title=row.title,
                content=row.content,
                score=_cosine_similarity(query_embedding, list(row.embedding)),
            )
            for row in queryset
        ),
        key=lambda item: item.score,
        reverse=True,
    )
    return ranked[:limit]
