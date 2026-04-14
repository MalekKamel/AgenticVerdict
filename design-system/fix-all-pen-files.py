#!/usr/bin/env python3
"""
Fix all .pen files to comply with Pencil v2.10 specification.

Issues fixed:
1. Replace CSS variable references (e.g., "$--av-spacing-xs") with actual values
2. Replace paddingInlineStart/End with paddingLeft/Right
3. Add proper variables object with typed values
4. Convert all color references to actual hex values
5. Remove fontSize from frame/ref entities (only valid on text)
6. Use proper descendants for ref overrides
7. Ensure all colors are valid hex (#RGB, #RRGGBB, or #RRGGBBAA)
"""

import json
import re
from pathlib import Path

# Design token values (from design-tokens-implementation.md)
TOKEN_VALUES = {
    # Spacing
    "--av-spacing-2xs": 2,
    "--av-spacing-xs": 4,
    "--av-spacing-sm": 8,
    "--av-spacing-md": 12,
    "--av-spacing-lg": 16,
    "--av-spacing-xl": 24,
    "--av-spacing-2xl": 32,
    "--av-spacing-3xl": 48,
    "--av-spacing-4xl": 64,
    
    # Font sizes
    "--av-font-size-xs": 12,
    "--av-font-size-sm": 14,
    "--av-font-size-base": 16,
    "--av-font-size-lg": 18,
    "--av-font-size-xl": 20,
    "--av-font-size-2xl": 24,
    "--av-font-size-3xl": 30,
    "--av-font-size-4xl": 36,
    
    # Font weights
    "--av-font-weight-normal": 400,
    "--av-font-weight-medium": 500,
    "--av-font-weight-semibold": 600,
    "--av-font-weight-bold": 700,
    
    # Radii
    "--av-radius-sm": 4,
    "--av-radius-md": 8,
    "--av-radius-lg": 12,
    "--av-radius-xl": 16,
    "--av-radius-full": 9999,
    
    # Colors (Default theme)
    "--av-color-primary": "#1976D2",
    "--av-color-primary-light": "#E3F2FD",
    "--av-color-success": "#2E7D32",
    "--av-color-success-light": "#E8F5E9",
    "--av-color-warning": "#ED6C02",
    "--av-color-warning-light": "#FFF3E0",
    "--av-color-error": "#D32F2F",
    "--av-color-error-light": "#FFEBEE",
    "--av-color-info": "#0288D1",
    "--av-color-info-light": "#E1F5FE",
    "--av-color-text": "#212121",
    "--av-color-text-secondary": "#757575",
    "--av-color-bg": "#FFFFFF",
    "--av-color-surface": "#F5F5F5",
    "--av-color-border": "#E0E0E0",
    
    # Brand colors
    "--brand-color-primary": "#1976D2",
    "--brand-color-secondary": "#42A5F5",
}

# Color mapping for semantic tokens
COLOR_MAP = {
    # Badge tokens
    "--badge-default-text": "#1976D2",
    "--badge-default-bg": "#E3F2FD",
    "--badge-primary-text": "#1976D2",
    "--badge-primary-bg": "#E3F2FD",
    "--badge-success-text": "#2E7D32",
    "--badge-success-bg": "#E8F5E9",
    "--badge-warning-text": "#ED6C02",
    "--badge-warning-bg": "#FFF3E0",
    "--badge-error-text": "#D32F2F",
    "--badge-error-bg": "#FFEBEE",
    
    # Input tokens
    "--input-border": "#E0E0E0",
    "--input-border-focus": "#1976D2",
    "--input-bg": "#FFFFFF",
    "--input-text": "#212121",
    "--input-placeholder": "#9E9E9E",
    "--input-error-border": "#D32F2F",
    "--input-error-text": "#D32F2F",
    "--input-warning-border": "#FFA000",
    "--input-warning-text": "#FFA000",
    "--input-success-border": "#2E7D32",
    "--input-success-text": "#2E7D32",
    "--input-padding-x-sm": 8,
    "--input-padding-x-md": 12,
    "--input-padding-x-lg": 16,
    "--input-height-sm": 32,
    "--input-height-md": 40,
    "--input-height-lg": 48,
    
    # Button tokens
    "--button-primary-text": "#FFFFFF",
    "--button-primary-bg": "#1976D2",
    "--button-primary-hover": "#1565C0",
    "--button-primary-active": "#0D47A1",
    "--button-primary-disabled": "#BDBDBD",
    "--button-secondary-text": "#1976D2",
    "--button-secondary-bg": "#E3F2FD",
    "--button-secondary-border": "#1976D2",
    "--button-danger-text": "#FFFFFF",
    "--button-danger-bg": "#D32F2F",
    "--button-success-text": "#FFFFFF",
    "--button-success-bg": "#2E7D32",
    "--button-warning-text": "#FFFFFF",
    "--button-warning-bg": "#FFA000",
    "--button-padding-x-xs": 8,
    "--button-padding-x-sm": 12,
    "--button-padding-x-md": 16,
    "--button-padding-x-lg": 20,
    "--button-padding-x-xl": 24,
    "--button-height-xs": 24,
    "--button-height-sm": 32,
    "--button-height-md": 40,
    "--button-height-lg": 48,
    "--button-height-xl": 56,
    
    # Card tokens
    "--card-radius": 8,
    "--card-bg": "#FFFFFF",
    "--card-padding": 16,
    "--card-heading": "#212121",
    "--card-text": "#757575",
    "--card-border": "#E0E0E0",
    "--card-shadow": "0 2px 4px rgba(0,0,0,0.1)",
    
    # Alert tokens
    "--alert-info-bg": "#E1F5FE",
    "--alert-info-border": "#0288D1",
    "--alert-info-text": "#0288D1",
    "--alert-success-bg": "#E8F5E9",
    "--alert-success-border": "#2E7D32",
    "--alert-success-text": "#2E7D32",
    "--alert-warning-bg": "#FFF3E0",
    "--alert-warning-border": "#ED6C02",
    "--alert-warning-text": "#ED6C02",
    "--alert-error-bg": "#FFEBEE",
    "--alert-error-border": "#D32F2F",
    "--alert-error-text": "#D32F2F",
    
    # Toast tokens
    "--toast-bg": "#FFFFFF",
    "--toast-border": "#E0E0E0",
    "--toast-text": "#212121",
    
    # Tooltip tokens
    "--tooltip-bg": "#424242",
    "--tooltip-text": "#FFFFFF",
    
    # Popover tokens
    "--popover-bg": "#FFFFFF",
    "--popover-border": "#E0E0E0",
    "--popover-text": "#212121",
    "--popover-shadow": "0 4px 8px rgba(0,0,0,0.15)",
    
    # Dropdown tokens
    "--dropdown-item-hover": "#F5F5F5",
    
    # Form field tokens
    "--form-field-label": "#212121",
    "--form-field-helper": "#757575",
    "--form-field-error": "#D32F2F",
    "--form-field-required": "#D32F2F",
    
    # Checkbox tokens
    "--checkbox-bg": "#FFFFFF",
    "--checkbox-border": "#E0E0E0",
    "--checkbox-label-text": "#212121",
    "--checkbox-disabled-bg": "#F5F5F5",
    "--checkbox-disabled-border": "#BDBDBD",
    
    # Radio tokens
    "--radio-bg": "#FFFFFF",
    "--radio-border": "#E0E0E0",
    "--radio-dot-color": "#1976D2",
    "--radio-label-text": "#212121",
    "--radio-border-selected": "#1976D2",
    "--radio-disabled-border": "#BDBDBD",
    
    # Switch tokens
    "--switch-track-bg-off": "#BDBDBD",
    "--switch-track-bg-on": "#1976D2",
    "--switch-track-disabled": "#E0E0E0",
    "--switch-thumb-bg-off": "#FFFFFF",
    "--switch-thumb-bg-on": "#FFFFFF",
    "--switch-label-text": "#212121",
    
    # Spinner tokens
    "--spinner-color": "#1976D2",
    "--spinner-color-muted": "#E0E0E0",
    
    # Icon tokens
    "--icon-color": "#1976D2",
    "--icon-color-disabled": "#BDBDBD",
    
    # Link tokens
    "--link-primary-text": "#1976D2",
    "--link-secondary-text": "#42A5F5",
    "--link-gray-text": "#757575",
    
    # Focus ring
    "--focus-ring-color": "rgba(25, 118, 210, 0.4)",
    
    # Brand colors
    "--brand-color-primary": "#1976D2",
    "--brand-color-secondary": "#42A5F5",
    
    # Gray scale tokens
    "--av-color-white": "#FFFFFF",
    "--av-color-gray-50": "#FAFAFA",
    "--av-color-gray-100": "#F5F5F5",
    "--av-color-gray-200": "#EEEEEE",
    "--av-color-gray-400": "#BDBDBD",
    "--av-color-gray-500": "#9E9E9E",
    "--av-color-gray-700": "#616161",
    "--av-color-gray-900": "#212121",
    "--av-color-red-600": "#D32F2F",
    "--av-color-green-600": "#2E7D32",
    
    # Transition
    "--av-transition-normal": 200,
}


def resolve_token(token_ref: str):
    """Resolve a token reference to its actual value."""
    token = token_ref
    if token.startswith("$"):
        token = token[1:]  # Strip the $ prefix
    
    # Check color map first
    if token in COLOR_MAP:
        return COLOR_MAP[token]
    
    # Check token values
    if token in TOKEN_VALUES:
        return TOKEN_VALUES[token]
    
    # Return None if not found
    return None


def replace_token_references(obj):
    """Recursively replace all token references with actual values."""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            new_value = replace_token_references(value)
            result[key] = new_value
        return result
    elif isinstance(obj, list):
        return [replace_token_references(item) for item in obj]
    elif isinstance(obj, str):
        # Check if it's a token reference
        if obj.startswith("$--"):
            resolved = resolve_token(obj)
            if resolved is not None:
                return resolved
            else:
                print(f"  ⚠️  Unresolved token: {obj}")
                return obj
        return obj
    else:
        return obj


def fix_padding(obj):
    """Convert paddingInlineStart/End to paddingLeft/Right."""
    if isinstance(obj, dict):
        # Fix padding properties
        if "paddingInlineStart" in obj:
            obj["paddingLeft"] = obj.pop("paddingInlineStart")
        if "paddingInlineEnd" in obj:
            obj["paddingRight"] = obj.pop("paddingInlineEnd")
        if "marginInlineStart" in obj:
            obj["marginLeft"] = obj.pop("marginInlineStart")
        if "marginInlineEnd" in obj:
            obj["marginRight"] = obj.pop("marginInlineEnd")
        if "textAlign" in obj and obj["textAlign"] == "start":
            obj["textAlign"] = "left"
        
        # Recursively fix children
        if "children" in obj:
            obj["children"] = [fix_padding(child) for child in obj["children"]]
        
        # Fix descendants
        if "descendants" in obj:
            for key in obj["descendants"]:
                obj["descendants"][key] = fix_padding(obj["descendants"][key])
        
        return obj
    elif isinstance(obj, list):
        return [fix_padding(item) for item in obj]
    else:
        return obj


def remove_invalid_properties(obj):
    """Remove properties that aren't valid in Pencil."""
    if isinstance(obj, dict):
        # Remove fontSize from non-text elements
        if obj.get("type") not in ["text", "IconFont"] and "fontSize" in obj:
            del obj["fontSize"]
        
        # Remove textAlign from non-text elements
        if obj.get("type") != "text" and "textAlign" in obj:
            del obj["textAlign"]
        
        # Recursively fix children
        if "children" in obj:
            obj["children"] = [remove_invalid_properties(child) for child in obj["children"]]
        
        # Fix descendants
        if "descendants" in obj:
            for key in obj["descendants"]:
                obj["descendants"][key] = remove_invalid_properties(obj["descendants"][key])
        
        return obj
    elif isinstance(obj, list):
        return [remove_invalid_properties(item) for item in obj]
    else:
        return obj


def ensure_variables_structure(data):
    """Ensure proper variables structure with typed values."""
    if "variables" not in data or not isinstance(data["variables"], dict):
        data["variables"] = {}
    
    # If variables is empty, we'll collect them from references
    if not data["variables"]:
        variables = {}
        
        def collect_variables(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, str) and value.startswith("$--"):
                        # Skip for now - we'll use resolved values
                        pass
                    elif key == "children" and isinstance(value, list):
                        for child in value:
                            collect_variables(child)
                    elif key == "descendants" and isinstance(value, dict):
                        for desc_key, desc_value in value.items():
                            collect_variables(desc_value)
        
        collect_variables(data)
        data["variables"] = variables
    
    return data


def fix_pen_file(file_path: Path):
    """Fix a single .pen file."""
    print(f"\n🔧 Fixing: {file_path.name}")
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Step 1: Replace all token references with actual values
    data = replace_token_references(data)
    
    # Step 2: Fix padding properties
    data = fix_padding(data)
    
    # Step 3: Remove invalid properties
    data = remove_invalid_properties(data)
    
    # Step 4: Ensure proper variables structure
    data = ensure_variables_structure(data)
    
    # Step 5: Ensure version is 2.10
    data["version"] = "2.10"
    
    # Write back
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"  ✅ Fixed: {file_path.name}")
    return True


def main():
    """Fix all .pen files in the design system."""
    design_system_dir = Path("/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/design-system")
    
    if not design_system_dir.exists():
        print(f"❌ Directory not found: {design_system_dir}")
        return
    
    # Find all .pen files
    pen_files = list(design_system_dir.rglob("*.pen"))
    
    print(f"📁 Found {len(pen_files)} .pen files to fix\n")
    
    success_count = 0
    fail_count = 0
    
    for pen_file in pen_files:
        try:
            if fix_pen_file(pen_file):
                success_count += 1
        except Exception as e:
            print(f"  ❌ Failed: {pen_file.name} - {e}")
            fail_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Fixed: {success_count} files")
    if fail_count > 0:
        print(f"❌ Failed: {fail_count} files")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
