"""Reuse the guarded membership harness with fixed, isolated Leader test ports."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
source_path = ROOT / "scripts/membership/local_stack.py"
source = (
    source_path.read_text(encoding="utf-8")
    .replace("CastraVision-membership-test", "CastraVision-leader-test")
    .replace("membership-stack", "leader-stack")
    .replace("57300", "59300")
)
for port in range(57320, 57328):
    source = source.replace(str(port), str(port + 2000))
namespace = {"__file__": str(source_path), "__name__": "leader_disposable_stack"}
exec(compile(source, str(source_path), "exec"), namespace)
guard, sql, status = [namespace[name] for name in ("guard", "sql", "status")]

if __name__ == "__main__":
    namespace["main"]()
