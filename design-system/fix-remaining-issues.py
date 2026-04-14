#!/usr/bin/env python3
"""
Fix remaining validation errors in .pen files.

1. Fix design-tokens.pen: Convert var() references to actual hex values
2. Fix ref entities missing ref property: Add proper ref values
3. Fix checkbox.pen: Change 'icon' type to 'text' with checkmark
4. Fix icon.pen: Change 'icon_font' type to 'iconfont'
"""

import json
import re
from pathlib import Path

# Map CSS variables to actual values
CSS_VAR_MAP = {
    # Colors
    "var(--brand-color-primary)": "#1976D2",
    "var(--brand-color-secondary)": "#42A5F5",
    "var(--av-color-gray-0)": "#FFFFFF",
    "var(--av-color-gray-50)": "#FAFAFA",
    "var(--av-color-gray-100)": "#F5F5F5",
    "var(--av-color-gray-200)": "#EEEEEE",
    "var(--av-color-gray-300)": "#E0E0E0",
    "var(--av-color-gray-400)": "#BDBDBD",
    "var(--av-color-gray-500)": "#9E9E9E",
    "var(--av-color-gray-700)": "#616161",
    "var(--av-color-gray-900)": "#212121",
    "var(--av-color-blue-50)": "#E3F2FD",
    "var(--av-color-blue-100)": "#BBDEFB",
    "var(--av-color-blue-300)": "#64B5F6",
    "var(--av-color-blue-800)": "#1565C0",
    "var(--av-color-green-50)": "#E8F5E9",
    "var(--av-color-green-100)": "#C8E6C9",
    "var(--av-color-green-300)": "#81C784",
    "var(--av-color-green-500)": "#4CAF50",
    "var(--av-color-green-600)": "#2E7D32",
    "var(--av-color-green-800)": "#2E7D32",
    "var(--av-color-red-50)": "#FFEBEE",
    "var(--av-color-red-100)": "#FFCDD2",
    "var(--av-color-red-300)": "#E57373",
    "var(--av-color-red-500)": "#F44336",
    "var(--av-color-red-600)": "#D32F2F",
    "var(--av-color-red-800)": "#C62828",
    "var(--av-color-yellow-50)": "#FFFDE7",
    "var(--av-color-yellow-100)": "#FFF9C4",
    "var(--av-color-yellow-300)": "#FFF176",
    "var(--av-color-yellow-500)": "#FFEB3B",
    "var(--av-color-yellow-800)": "#F9A825",
    "var(--av-color-white)": "#FFFFFF",
    
    # Spacing
    "var(--av-spacing-sm)": "8",
    "var(--av-spacing-md)": "12",
    "var(--av-spacing-lg)": "16",
    "var(--av-spacing-xl)": "24",
    "var(--av-spacing-2xl)": "32",
    
    # Radii
    "var(--av-radius-lg)": "12",
    
    # Shadows (convert to string)
    "var(--av-shadow-md)": "0 2px 4px rgba(0,0,0,0.1)",
    "var(--av-shadow-lg)": "0 4px 8px rgba(0,0,0,0.15)",
    "var(--av-shadow-xl)": "0 8px 16px rgba(0,0,0,0.2)",
}


def fix_css_variables(obj):
    """Replace CSS variable references with actual values."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, str) and value.startswith("var("):
                if value in CSS_VAR_MAP:
                    obj[key] = CSS_VAR_MAP[value]
                    # Determine proper type
                    resolved = obj[key]
                    if resolved.startswith("#"):
                        obj["type"] = "color"
                    elif resolved.startswith("0 ") or "rgba" in resolved:
                        obj["type"] = "string"  # Shadow
                    else:
                        try:
                            int(resolved)
                            obj["type"] = "number"
                        except:
                            obj["type"] = "string"
            elif isinstance(value, dict):
                fix_css_variables(value)
            elif isinstance(value, list):
                for item in value:
                    fix_css_variables(item)
    elif isinstance(obj, list):
        for item in obj:
            fix_css_variables(item)


def fix_ref_entities(entity):
    """Fix ref entities missing ref property."""
    if isinstance(entity, dict):
        # If type is 'ref' and missing ref property, derive from id
        if entity.get("type") == "ref" and "ref" not in entity:
            # Generate ref from id (remove suffix like -state, -icon, etc.)
            entity_id = entity.get("id", "")
            # Common patterns
            if "icon" in entity_id:
                entity["ref"] = "icon-base"
            elif "close" in entity_id:
                entity["ref"] = "button-base"
            elif "action" in entity_id:
                entity["ref"] = "button-base"
            elif "dropdown" in entity_id or "menu" in entity_id:
                entity["ref"] = "dropdown-base"
            elif "option" in entity_id:
                entity["ref"] = "dropdown-item"
            elif "calendar" in entity_id or "date" in entity_id:
                entity["ref"] = "input-base"
            elif "input" in entity_id:
                entity["ref"] = "input-base"
            elif "label" in entity_id or "helper" in entity_id or "error" in entity_id:
                entity["ref"] = "typography-base"
            else:
                # Default fallback
                entity["ref"] = entity_id.split("-")[0] + "-base"
        
        # Recursively fix children
        if "children" in entity:
            for child in entity["children"]:
                fix_ref_entities(child)
        
        # Fix descendants
        if "descendants" in entity:
            for key in entity["descendants"]:
                if isinstance(entity["descendants"][key], dict):
                    fix_ref_entities(entity["descendants"][key])


def fix_icon_types(entity):
    """Fix invalid icon types."""
    if isinstance(entity, dict):
        # Change 'icon' type to 'text' with checkmark
        if entity.get("type") == "icon":
            entity["type"] = "text"
            entity["content"] = "✓"
            entity["fontSize"] = entity.get("fontSize", 12)
            entity["fill"] = entity.get("fill", "#1976D2")
        
        # Change 'icon_font' type to 'iconfont'
        if entity.get("type") == "icon_font":
            entity["type"] = "iconfont"
            entity["iconFontFamily"] = entity.get("iconFontFamily", "lucide")
            entity["iconName"] = entity.get("iconName", "star")
        
        # Recursively fix children
        if "children" in entity:
            for child in entity["children"]:
                fix_icon_types(child)


def fix_design_tokens(file_path: Path):
    """Fix design-tokens.pen CSS variable references."""
    print(f"🔧 Fixing {file_path.name}...")
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Fix CSS variables
    if "variables" in data:
        for var_name, var_data in data["variables"].items():
            if isinstance(var_data, dict) and "value" in var_data:
                value = var_data["value"]
                if isinstance(value, str) and value.startswith("var("):
                    if value in CSS_VAR_MAP:
                        new_value = CSS_VAR_MAP[value]
                        var_data["value"] = new_value
                        # Update type based on value
                        if new_value.startswith("#"):
                            var_data["type"] = "color"
                        elif "rgba" in new_value or new_value.startswith("0 "):
                            var_data["type"] = "string"
                        else:
                            try:
                                int(new_value)
                                var_data["type"] = "number"
                            except:
                                var_data["type"] = "string"
                        print(f"  ✓ Fixed {var_name}: {value} -> {new_value}")
                    else:
                        print(f"  ⚠️  Unmapped CSS var: {value}")
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"  ✅ Fixed {file_path.name}")


def fix_molecule_files(design_system_dir: Path):
    """Fix molecule .pen files with ref entity issues."""
    molecule_dir = design_system_dir / "molecules"
    
    for pen_file in molecule_dir.glob("*.pen"):
        print(f"\n🔧 Fixing {pen_file.name}...")
        
        with open(pen_file, 'r') as f:
            data = json.load(f)
        
        # Fix ref entities
        for child in data.get("children", []):
            fix_ref_entities(child)
        
        with open(pen_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"  ✅ Fixed {pen_file.name}")


def fix_atom_files(design_system_dir: Path):
    """Fix atom .pen files with icon type issues."""
    atom_dir = design_system_dir / "atoms"
    
    for pen_file in atom_dir.glob("*.pen"):
        print(f"\n🔧 Fixing {pen_file.name}...")
        
        with open(pen_file, 'r') as f:
            data = json.load(f)
        
        # Fix icon types
        for child in data.get("children", []):
            fix_icon_types(child)
        
        with open(pen_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"  ✅ Fixed {pen_file.name}")


def main():
    """Fix all remaining issues."""
    design_system_dir = Path("/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/design-system")
    
    # Fix design-tokens.pen
    fix_design_tokens(design_system_dir / "design-tokens.pen")
    
    # Fix molecule files
    fix_molecule_files(design_system_dir)
    
    # Fix atom files (checkbox, icon)
    fix_atom_files(design_system_dir)
    
    print("\n" + "="*60)
    print("✅ All fixes applied!")
    print("="*60)


if __name__ == "__main__":
    main()
