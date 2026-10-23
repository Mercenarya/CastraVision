"""Load performance fixtures only into the verified local Supabase stack."""

from __future__ import annotations

import subprocess
from pathlib import Path

from _guard import CONTAINER, EXPECTED_CONFIRMATION, require_local_stack


def main() -> None:
    require_local_stack()
    seed_path = Path(__file__).with_name("seed_perf_data.sql")
    subprocess.run(
        [
            "docker",
            "exec",
            "-i",
            CONTAINER,
            "psql",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-X",
            "-v",
            "ON_ERROR_STOP=1",
            "-v",
            f"perf_confirm={EXPECTED_CONFIRMATION}",
        ],
        check=True,
        input=seed_path.read_text(encoding="utf-8"),
        text=True,
    )


if __name__ == "__main__":
    main()
