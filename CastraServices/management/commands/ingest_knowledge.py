import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from CastraServices.models import KnowledgeChunk
from CastraServices.rag import ingest_document


class Command(BaseCommand):
    help = "Ingest JSON knowledge records and generate vector embeddings."

    def add_arguments(self, parser):
        parser.add_argument("path", type=Path)

    def handle(self, *args, **options):
        path: Path = options["path"]
        if not path.exists():
            raise CommandError(f"File not found: {path}")
        try:
            records = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise CommandError(f"Invalid UTF-8 JSON: {exc}") from exc
        if not isinstance(records, list):
            raise CommandError("The JSON root must be an array of records.")

        valid_sources = {choice for choice, _ in KnowledgeChunk.Source.choices}
        total_chunks = 0
        for index, record in enumerate(records):
            if not isinstance(record, dict):
                raise CommandError(f"Record {index} must be an object.")
            required = {"source", "external_id", "title", "content"}
            missing = required - record.keys()
            if missing:
                raise CommandError(f"Record {index} is missing: {sorted(missing)}")
            if record["source"] not in valid_sources:
                raise CommandError(f"Record {index} has unsupported source: {record['source']}")
            total_chunks += ingest_document(
                source=record["source"],
                external_id=str(record["external_id"]),
                title=str(record["title"]),
                content=str(record["content"]),
                metadata=record.get("metadata", {}),
            )
        self.stdout.write(self.style.SUCCESS(f"Ingested {total_chunks} chunks."))
