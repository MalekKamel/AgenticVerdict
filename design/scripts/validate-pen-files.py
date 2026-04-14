#!/usr/bin/env python3
"""
Validate .pen files against Pencil v2.10 specification.

Checks:
1. Version is "2.10"
2. Valid JSON structure
3. Required fields (version, children, id, type)
4. Valid entity types
5. Valid variable types (color must be hex)
6. No invalid properties (paddingInlineStart/End, etc.)
7. Valid color values (#RGB, #RRGGBB, #RRGGBBAA, or "transparent")
8. Ref entities have ref property
9. IDs don't contain "/"
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any

VALID_ENTITY_TYPES = [
    "frame", "group", "rectangle", "ellipse", "line",
    "path", "polygon", "text", "note", "prompt", "context",
    "iconfont",
    "icon_font",  # Pencil JSON export uses snake_case
    "ref",
]

VALID_VARIABLE_TYPES = ["boolean", "color", "number", "string"]

VALID_LAYOUTS = ["none", "vertical", "horizontal"]

COLOR_REGEX = re.compile(r'^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$')


class ValidationError:
    def __init__(self, file: str, path: str, message: str):
        self.file = file
        self.path = path
        self.message = message
    
    def __str__(self):
        return f"{self.file}:{self.path} - {self.message}"


def is_valid_color(value: Any) -> bool:
    """Check if a value is a valid color."""
    if not isinstance(value, str):
        return False
    
    # Allow transparent
    if value == "transparent":
        return True
    
    # Check hex color
    if COLOR_REGEX.match(value):
        return True
    
    return False


def validate_entity(entity: Dict[str, Any], file: str, path: str, errors: List[ValidationError]):
    """Validate a single entity and its children."""
    
    # Check required fields
    if "id" not in entity:
        errors.append(ValidationError(file, path, "Missing 'id' field"))
    else:
        # ID cannot contain "/"
        if "/" in entity["id"]:
            errors.append(ValidationError(file, path, f"ID '{entity['id']}' contains '/' character"))
    
    if "type" not in entity:
        errors.append(ValidationError(file, path, "Missing 'type' field"))
    else:
        # Check valid type
        if entity["type"] not in VALID_ENTITY_TYPES:
            errors.append(ValidationError(file, path, f"Invalid type: '{entity['type']}'"))
        
        # Ref entities must have ref property
        if entity["type"] == "ref" and "ref" not in entity:
            errors.append(ValidationError(file, path, "Ref entity missing 'ref' property"))
    
    # Check for invalid properties
    invalid_props = ["paddingInlineStart", "paddingInlineEnd", "marginInlineStart", "marginInlineEnd"]
    for prop in invalid_props:
        if prop in entity:
            errors.append(ValidationError(file, path, f"Invalid property: '{prop}' (use paddingLeft/Right or marginLeft/Right)"))
    
    # Check layout property
    if "layout" in entity and entity["layout"] not in VALID_LAYOUTS:
        errors.append(ValidationError(file, path, f"Invalid layout: '{entity['layout']}'"))
    
    # Check color properties
    color_props = ["fill", "stroke"]
    for prop in color_props:
        if prop in entity:
            value = entity[prop]
            if isinstance(value, dict) and "color" in value:
                # Stroke object
                if not is_valid_color(value["color"]):
                    errors.append(ValidationError(file, path, f"Invalid stroke color: '{value['color']}'"))
            elif isinstance(value, str) and not is_valid_color(value) and not value.startswith("$"):
                # Direct fill color
                errors.append(ValidationError(file, path, f"Invalid fill color: '{value}'"))
    
    # Check children (only frame and group can have children)
    if "children" in entity:
        if entity.get("type") not in ["frame", "group"]:
            errors.append(ValidationError(file, path, f"Entity type '{entity.get('type')}' cannot have children"))
        else:
            for i, child in enumerate(entity["children"]):
                validate_entity(child, file, f"{path}/children[{i}]", errors)
    
    # Check descendants in ref entities
    if "descendants" in entity and isinstance(entity["descendants"], dict):
        for desc_id, desc_props in entity["descendants"].items():
            if "/" in desc_id:
                # This is valid for descendant overrides
                pass


def validate_pen_file(file_path: Path) -> List[ValidationError]:
    """Validate a single .pen file."""
    errors = []
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [ValidationError(file_path.name, "root", f"Invalid JSON: {e}")]
    
    # Check version
    if "version" not in data:
        errors.append(ValidationError(file_path.name, "root", "Missing 'version' field"))
    elif data["version"] != "2.10":
        errors.append(ValidationError(file_path.name, "root", f"Invalid version: '{data['version']}' (expected '2.10')"))
    
    # Check children
    if "children" not in data:
        errors.append(ValidationError(file_path.name, "root", "Missing 'children' array"))
    elif not isinstance(data["children"], list):
        errors.append(ValidationError(file_path.name, "root", "'children' must be an array"))
    else:
        # Validate root entities
        for i, child in enumerate(data["children"]):
            validate_entity(child, file_path.name, f"children[{i}]", errors)
    
    # Check variables
    if "variables" in data and isinstance(data["variables"], dict):
        for var_name, var_data in data["variables"].items():
            if ":" in var_name:
                errors.append(ValidationError(file_path.name, f"variables.{var_name}", "Variable name cannot contain ':'"))
            
            if isinstance(var_data, dict):
                if "type" not in var_data:
                    errors.append(ValidationError(file_path.name, f"variables.{var_name}", "Missing 'type' in variable"))
                elif var_data["type"] not in VALID_VARIABLE_TYPES:
                    errors.append(ValidationError(file_path.name, f"variables.{var_name}", f"Invalid variable type: '{var_data['type']}'"))
                
                # Check color values
                if var_data.get("type") == "color" and "value" in var_data:
                    if not is_valid_color(var_data["value"]):
                        errors.append(ValidationError(file_path.name, f"variables.{var_name}", f"Invalid color value: '{var_data['value']}'"))
    
    return errors


def main():
    """Validate all .pen files under design/ (system/, features/, legacy paths during transition)."""
    design_system_dir = Path(__file__).resolve().parent
    
    if not design_system_dir.exists():
        print(f"❌ Directory not found: {design_system_dir}")
        return
    
    # Find all .pen files
    pen_files = list(design_system_dir.rglob("*.pen"))
    
    print(f"📁 Validating {len(pen_files)} .pen files\n")
    
    all_errors = []
    files_with_errors = 0
    
    for pen_file in pen_files:
        errors = validate_pen_file(pen_file)
        if errors:
            files_with_errors += 1
            print(f"\n❌ {pen_file.name} ({len(errors)} errors)")
            for error in errors:
                print(f"   {error.path}: {error.message}")
            all_errors.extend(errors)
        else:
            print(f"✅ {pen_file.name}")
    
    print(f"\n{'='*60}")
    if all_errors:
        print(f"❌ {len(all_errors)} errors found in {files_with_errors} files")
    else:
        print(f"✅ All {len(pen_files)} files are valid!")
    print(f"{'='*60}")
    
    return len(all_errors) == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
