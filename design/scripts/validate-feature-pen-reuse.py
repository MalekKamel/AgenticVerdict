#!/usr/bin/env python3
"""
Phase B heuristic: flag feature .pen reusable masters whose names collide with
system library root prefixes (e.g. Button/, FormField/) — see
design/docs/research/pen-feature-ref-reusability-implementation-plan.md §3.3.

Feature-local reusables MUST use a domain prefix (e.g. Auth/Button/Base), not
mirror system root names (Button/Default), unless listed in the allowlist.

Usage:
  python3 design/scripts/validate-feature-pen-reuse.py
  python3 design/scripts/validate-feature-pen-reuse.py --strict   # exit 1 on violations
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _walk_children(nodes: list | None, visit) -> None:
    if not nodes:
        return
    for entity in nodes:
        visit(entity)
        if entity.get("type") in ("frame", "group") and "children" in entity:
            _walk_children(entity["children"], visit)


def collect_system_prefixes(system_dir: Path) -> set[str]:
    """First path segment of every reusable name in system/*.pen (excluding design-tokens)."""
    prefixes: set[str] = set()
    for pen in sorted(system_dir.glob("*.pen")):
        if pen.name == "design-tokens.pen":
            continue
        try:
            data = json.loads(pen.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            print(f"❌ {pen}: {e}", file=sys.stderr)
            continue

        def visit(entity: dict) -> None:
            if entity.get("reusable") and entity.get("name"):
                first = entity["name"].split("/")[0]
                prefixes.add(first)

        _walk_children(data.get("children"), visit)
    return prefixes


def load_allowlist(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    allowed: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        allowed.add(line)
    return allowed


def collect_violations(
    features_dir: Path,
    system_prefixes: set[str],
    allowlist: set[str],
) -> list[tuple[str, str]]:
    """Returns (relative_path, reusable_name) for each violation."""
    violations: list[tuple[str, str]] = []
    design_system = features_dir.parent

    for pen in sorted(features_dir.rglob("*.pen")):
        try:
            data = json.loads(pen.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            print(f"❌ {pen}: {e}", file=sys.stderr)
            continue

        rel = str(pen.relative_to(design_system))

        def visit(entity: dict) -> None:
            if not entity.get("reusable") or not entity.get("name"):
                return
            name = entity["name"]
            if name in allowlist:
                return
            first = name.split("/")[0]
            if first in system_prefixes:
                violations.append((rel, name))

        _walk_children(data.get("children"), visit)

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate feature .pen reuse naming heuristics.")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 if any violation is found (default: warn only).",
    )
    args = parser.parse_args()

    design_system = Path(__file__).resolve().parent.parent
    system_dir = design_system / "system"
    features_dir = design_system / "features"
    allowlist_path = features_dir / ".pen-reuse-allowlist"

    if not features_dir.is_dir():
        print("ℹ️  No design/features/ directory; skipping feature reuse check.")
        return 0

    system_prefixes = collect_system_prefixes(system_dir)
    allowlist = load_allowlist(allowlist_path)
    violations = collect_violations(features_dir, system_prefixes, allowlist)

    print(f"📁 Feature .pen reuse check ({len(list(features_dir.rglob('*.pen')))} file(s))")
    print(f"   System root prefixes loaded: {len(system_prefixes)}")
    if allowlist:
        print(f"   Allowlist entries: {len(allowlist)}")

    if not violations:
        print("✅ No system-prefix collisions in feature reusable names.")
        return 0

    print("⚠️  Reusable names under features/ use the same root segment as a system master.", file=sys.stderr)
    print("   Use a domain prefix (e.g. Auth/Button/Base) or add an approved line to", file=sys.stderr)
    print(f"   {allowlist_path.relative_to(design_system.parent)}", file=sys.stderr)
    for rel, name in violations:
        print(f"   • {rel}: “{name}”", file=sys.stderr)

    return 1 if args.strict else 0


if __name__ == "__main__":
    raise SystemExit(main())
