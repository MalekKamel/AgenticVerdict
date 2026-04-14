#!/usr/bin/env python3
"""
Refactor auth.pen to remove duplicate auth-specific components and use system library references.

This script:
1. Deletes the 5 auth-specific component definitions (ZoQdG, oTxhG, yMbmO, R6srm, x04Fm)
2. Updates all 31 instances to use system library references
3. Maps descendant paths from auth-specific child IDs to system library child IDs
"""

import json
import sys
from pathlib import Path

# Mapping of auth-specific component IDs to system library components
AUTH_TO_SYSTEM = {
    'ZoQdG': 'molecules:button-base',   # Auth/Button/Base
    'oTxhG': 'molecules:form-field-base',  # Auth/FormField
    'yMbmO': 'molecules:card-base',     # Auth/Card
    'R6srm': 'molecules:checkbox-base',  # Auth/Checkbox
    'x04Fm': 'molecules:alert-base-error',  # Auth/Alert/Error
}

# Mapping of auth-specific child IDs to system library child IDs
AUTH_TO_SYSTEM_CHILDREN = {
    # Auth/Button/Base children → molecules:button-base children
    '2EE9u': 'molecules:button-label',  # authBtnLabel → button-label

    # Auth/FormField children → molecules:form-field-base children
    'Bhsbu': 'molecules:form-field-label',      # authFieldLabel
    '66y4m': 'molecules:form-field-input',      # authFieldInput (frame containing input)
    '6Cxeq': 'molecules:form-field-input-text', # authFieldInputText
    'JZulJ': 'molecules:form-field-helper',     # authFieldHelper

    # Auth/Card children → molecules:card-base children
    'LN3yN': 'molecules:card-header',  # authCardHeader
    'KJL4H': 'molecules:card-body',    # authCardBody
    'ZPZ9p': 'molecules:card-heading', # authCardTitle → card-heading
    'ZHT2G': 'molecules:card-content', # authCardSubtitle → repurpose card-content

    # Auth/Checkbox children → molecules:checkbox-base children
    'Vkfid': 'molecules:checkbox-box',   # authCheckboxBox
    'n1TDm': 'molecules:checkbox-check', # authCheckboxMark
    'pzAom': 'molecules:checkbox-label', # authCheckboxLabel

    # Auth/Alert/Error children → molecules:alert-base-error children
    'yV6Bw': 'molecules:alert-icon',    # authAlertIcon
    'bQFLN': 'molecules:alert-message', # authAlertMsg
}


def map_descendant_path(old_path, ref_id):
    """
    Map a descendant path from auth-specific child IDs to system library child IDs.

    Args:
        old_path: The descendant path key (e.g., "ZPZ9p" or "KJL4H/6Cxeq")
        ref_id: The ref ID of the parent component

    Returns:
        The mapped descendant path for the system component
    """
    # Split the path by "/" to handle nested paths
    parts = old_path.split("/")

    # Map each part to the system component equivalent
    mapped_parts = []
    for part in parts:
        mapped_part = AUTH_TO_SYSTEM_CHILDREN.get(part, part)
        mapped_parts.append(mapped_part)

    return "/".join(mapped_parts)


def ref_transform(node):
    """
    Transform a ref node to use system library references.

    Args:
        node: A dict representing a ref node

    Returns:
        True if the node was modified, False otherwise
    """
    ref_id = node.get('ref')
    if ref_id in AUTH_TO_SYSTEM:
        # Update the ref to use system library
        node['ref'] = AUTH_TO_SYSTEM[ref_id]

        # Map descendant paths if present
        if 'descendants' in node:
            new_descendants = {}
            for old_path, desc_value in node['descendants'].items():
                new_path = map_descendant_path(old_path, ref_id)
                new_descendants[new_path] = desc_value
            node['descendants'] = new_descendants

        return True
    return False


def should_delete_node(node):
    """Check if a node should be deleted (auth-specific component definition)."""
    return isinstance(node, dict) and node.get('reusable') == True and node.get('id') in AUTH_TO_SYSTEM


def transform_tree(node):
    """
    Recursively transform the tree:
    1. Delete auth-specific component definitions
    2. Update refs to use system library references
    3. Also transform refs inside descendants
    """
    if isinstance(node, list):
        # Transform all children and remove deleted nodes
        new_children = []
        for child in node:
            if should_delete_node(child):
                continue  # Skip this node (delete it)
            # Transform ref at this level
            ref_transform(child)
            # Recursively transform children and descendants
            transform_tree(child)
            new_children.append(child)
        node[:] = new_children
    elif isinstance(node, dict):
        # Transform this node if it's a ref
        ref_transform(node)
        # Recursively transform children
        if 'children' in node:
            transform_tree(node['children'])
        # Recursively transform descendants (for card instances containing form fields)
        if 'descendants' in node:
            transform_tree(node['descendants'])


def main():
    input_file = Path('/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/design/features/auth.pen')
    output_file = Path('/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/design/features/auth.pen')

    # Read the input file
    with open(input_file, 'r') as f:
        data = json.load(f)

    # Count stats before transformation
    ref_count_before = sum(1 for _ in str(data).split('"ref":')) - 1
    reusable_count_before = str(data).count('"reusable": true')

    # Apply transformations
    transform_tree(data)

    # Count stats after transformation
    ref_count_after = sum(1 for _ in str(data).split('"ref":')) - 1
    reusable_count_after = str(data).count('"reusable": true')

    # Write the output
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Refactored {input_file}")
    print(f"  Refs: {ref_count_before} → {ref_count_after}")
    print(f"  Reusable components: {reusable_count_before} → {reusable_count_after}")
    print(f"  Deleted {reusable_count_before - reusable_count_after} auth-specific component definitions")
    print(f"  Updated all instances to use system library references")


if __name__ == '__main__':
    main()
