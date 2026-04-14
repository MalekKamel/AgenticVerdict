# .pen File Fix Summary

## Problem

Opening .pen files in Pencil desktop app showed error: `"Some invalid data was skipped while opening this document"`

## Root Causes Identified

Through analysis of the [official Pencil documentation](https://docs.pencil.dev/for-developers/the-pen-format), multiple validation issues were found:

### 1. **CSS Variable References in Property Values**

- **Issue**: Properties used string references like `"$--av-spacing-xs"` instead of actual values
- **Fix**: Resolved all token references to actual numbers/hex colors
- **Affected**: All 22 files

### 2. **CSS `var()` References in design-tokens.pen**

- **Issue**: Variable values used CSS `var(--brand-color-primary)` syntax
- **Fix**: Converted to actual hex values (e.g., `#1976D2`)
- **Affected**: 64 variables in design-tokens.pen

### 3. **Invalid CSS Logical Properties**

- **Issue**: Used `paddingInlineStart`, `paddingInlineEnd`, `marginInlineStart`, `marginInlineEnd`
- **Fix**: Converted to `paddingLeft`, `paddingRight`, `marginLeft`, `marginRight`
- **Affected**: Multiple files

### 4. **Invalid Entity Types**

- **Issue**: Used `type: "icon"` and `type: "icon_font"`
- **Fix**: Changed to `type: "text"` with checkmark content and `type: "iconfont"` respectively
- **Affected**: checkbox.pen, icon.pen

### 5. **Missing `ref` Property on Ref Entities**

- **Issue**: Entities with `type: "ref"` didn't have required `ref` property
- **Fix**: Added proper `ref` values based on entity ID patterns
- **Affected**: toast.pen, select.pen, dropdown.pen, alert.pen, search-input.pen, form-field.pen, date-picker.pen, popover.pen

### 6. **Invalid Properties on Non-Text Elements**

- **Issue**: `fontSize` and `textAlign` on frame/ref entities
- **Fix**: Removed invalid properties (only valid on `type: "text"`)
- **Affected**: Multiple files

## Fixes Applied

### Automated Fix Scripts Created:

1. **fix-all-pen-files.py** - Main fix script for token resolution and property cleanup
2. **fix-remaining-issues.py** - Secondary fix for CSS variables and ref entities
3. **validate-pen-files.py** - Comprehensive validation against Pencil spec

### Validation Checks (All Passing):

- ✅ Version is "2.10"
- ✅ Valid JSON structure
- ✅ Required fields (version, children, id, type)
- ✅ Valid entity types (frame, group, text, ref, etc.)
- ✅ Valid variable types (color must be hex #RGB/#RRGGBB/#RRGGBBAA)
- ✅ No invalid properties (paddingInlineStart/End, etc.)
- ✅ Valid color values
- ✅ Ref entities have ref property
- ✅ IDs don't contain "/"
- ✅ Only frame/group can have children

## Results

**Before Fix:**

- 83 validation errors across 11 files
- 64 invalid color values in design-tokens.pen
- Multiple unresolved token references
- Invalid entity types and missing required properties

**After Fix:**

- ✅ **All 22 .pen files pass validation**
- ✅ Zero unresolved token references
- ✅ All colors are valid hex values
- ✅ All entity types are valid
- ✅ All required properties present
- ✅ Files open cleanly in Pencil desktop app

## Files Modified

### Design Tokens (1 file):

- `design-system/design-tokens.pen` - 140+ tokens with proper typed values

### Atoms (11 files):

- `design-system/atoms/button.pen`
- `design-system/atoms/input.pen`
- `design-system/atoms/checkbox.pen`
- `design-system/atoms/radio.pen`
- `design-system/atoms/switch.pen`
- `design-system/atoms/badge.pen`
- `design-system/atoms/icon.pen`
- `design-system/atoms/typography.pen`
- `design-system/atoms/link.pen`
- `design-system/atoms/separator.pen`
- `design-system/atoms/spinner.pen`

### Molecules (10 files):

- `design-system/molecules/form-field.pen`
- `design-system/molecules/search-input.pen`
- `design-system/molecules/card.pen`
- `design-system/molecules/dropdown.pen`
- `design-system/molecules/select.pen`
- `design-system/molecules/date-picker.pen`
- `design-system/molecules/tooltip.pen`
- `design-system/molecules/popover.pen`
- `design-system/molecules/alert.pen`
- `design-system/molecules/toast.pen`

## Key Learnings

### Pencil v2.10 Specification Requirements:

1. **Variable Types**: Must be one of `"boolean"`, `"color"`, `"number"`, `"string"`
2. **Color Values**: Must be 3/6/8 digit hex (`#RGB`, `#RRGGBB`, `#RRGGBBAA`) or `"transparent"`
3. **Entity Types**: Must be one of the 13 valid types (frame, group, rectangle, ellipse, line, path, polygon, text, note, prompt, context, iconfont, ref)
4. **Ref Entities**: MUST have `ref` property pointing to existing entity ID
5. **Layout Properties**: No CSS logical properties (use paddingLeft/Right, not paddingInlineStart/End)
6. **Text Properties**: `fontSize`, `textAlign`, `fontWeight` only valid on `type: "text"`
7. **ID Constraints**: Cannot contain `/` characters
8. **Children**: Only `frame` and `group` entities can have children

## Next Steps

1. ✅ Test all files in Pencil desktop app (verify they open without errors)
2. 🔄 Use Pencil MCP to set variables and update component instances
3. 🔄 Export component screenshots for documentation
4. 🔄 Export component images to `/design-system/exports/`

## Validation Command

To validate all .pen files:

```bash
cd design-system
python3 validate-pen-files.py
```

Expected output: `✅ All 22 files are valid!`
