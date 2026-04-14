#!/usr/bin/env python3
"""
One-off mechanical merge for pen architecture migration.

Builds:
- design/system/design-tokens.lib.pen (copy of root design-tokens.pen)
- design/system/atoms.lib.pen (merged atom children + variables)
- design/system/molecules.lib.pen (atom + molecule children, same-document refs)

Run from repo root: python3 design/scripts/merge-pen-system-layout.py
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DS = REPO / "design-system"


def load(p: Path) -> dict:
    with p.open() as f:
        return json.load(f)


def merge_variables(parts: list[dict]) -> dict:
    out: dict = {}
    for v in parts:
        for k, val in (v or {}).items():
            if k in out and out[k] != val:
                raise ValueError(f"variable collision: {k}")
            out[k] = val
    return out


def main() -> None:
    atom_paths = sorted((DS / "atoms").glob("*.pen"))
    mol_paths = sorted((DS / "molecules").glob("*.pen"))

    atom_children: list = []
    atom_vars: dict = {}
    for p in atom_paths:
        data = load(p)
        atom_children.extend(data.get("children") or [])
        atom_vars = merge_variables([atom_vars, data.get("variables") or {}])

    mol_children: list = []
    mol_vars: dict = {}
    for p in mol_paths:
        data = load(p)
        mol_children.extend(data.get("children") or [])
        mol_vars = merge_variables([mol_vars, data.get("variables") or {}])

    system = DS / "system"
    system.mkdir(parents=True, exist_ok=True)

    # design-tokens
    shutil.copy2(DS / "design-tokens.pen", system / "design-tokens.pen")

    atoms_out = {"version": "2.10", "variables": atom_vars, "children": atom_children}
    with (system / "atoms.pen").open("w") as f:
        json.dump(atoms_out, f, indent=2)
        f.write("\n")

    mol_combined_vars = merge_variables([atom_vars, mol_vars])
    molecules_out = {
        "version": "2.10",
        "variables": mol_combined_vars,
        "children": atom_children + mol_children,
    }
    with (system / "molecules.pen").open("w") as f:
        json.dump(molecules_out, f, indent=2)
        f.write("\n")

    features = DS / "features"
    features.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DS / "templates" / "authentication.pen", features / "auth.pen")

    print("Wrote:", system / "design-tokens.pen")
    print("Wrote:", system / "atoms.pen", f"({len(atom_children)} root children)")
    print("Wrote:", system / "molecules.pen", f"({len(atom_children + mol_children)} root children)")
    print("Wrote:", features / "auth.pen")


if __name__ == "__main__":
    main()
