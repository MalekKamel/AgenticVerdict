# Multi-Language & RTL Testing Procedures

**Document Version:** 1.0
**Last Updated:** 2026-04-09
**Purpose:** Comprehensive procedures for testing multi-language support and proper RTL/LTR rendering across all report formats.

---

## Table of Contents

1. [Overview](#overview)
2. [Supported Languages](#supported-languages)
3. [Testing Infrastructure](#testing-infrastructure)
4. [Language-Specific Testing](#language-specific-testing)
5. [RTL Validation](#rtl-validation)
6. [Format-Specific Testing](#format-specific-testing)
7. [Localization Testing](#localization-testing)

---

## Overview

The AgenticVerdict system supports multiple languages with automatic RTL/LTR detection and rendering. This testing framework ensures:

- Proper text rendering for all supported languages
- Correct layout direction (RTL for Arabic, LTR for English/French)
- Font support for all character sets
- Date, number, and currency formatting per locale
- Cultural appropriateness of content

### Language Support Matrix

| Language | Code | Direction | Font Support     | Status             |
| -------- | ---- | --------- | ---------------- | ------------------ |
| English  | `en` | LTR       | System fonts     | ✅ Fully Supported |
| Arabic   | `ar` | RTL       | Noto Sans Arabic | ✅ Fully Supported |
| French   | `fr` | LTR       | System fonts     | ✅ Supported       |

---

## Supported Languages

### English (en)

**Characteristics:**

- **Direction:** LTR (Left-to-Right)
- **Character Set:** Latin alphabet
- **Number Format:** 1,234.56
- **Date Format:** MM/DD/YYYY or DD/MM/YYYY based on region
- **Currency:** $, €, £, etc.

**Testing Requirements:**

- [ ] Text flows left to right
- [ ] Numbers formatted correctly
- [ ] Dates display in expected format
- [ ] No character encoding issues
- [ ] Font rendering is crisp

### Arabic (ar)

**Characteristics:**

- **Direction:** RTL (Right-to-Left)
- **Character Set:** Arabic script
- **Number Format:** 1,234.56 (Arabic numerals or Eastern Arabic numerals: ١٢٣٤)
- **Date Format:** DD/MM/YYYY
- **Currency:** ر.س, د.إ, etc.

**Testing Requirements:**

- [ ] Text flows right to left
- [ ] Arabic characters render correctly
- [ ] No character clipping or overflow
- [ ] Proper ligature formation
- [ ] Diacritical marks display correctly
- [ ] Numbers formatted appropriately
- [ ] Layout mirrored correctly (navigation, sidebars, etc.)

### French (fr)

**Characteristics:**

- **Direction:** LTR
- **Character Set:** Latin alphabet with accents
- **Number Format:** 1 234,56 (space as thousands separator, comma as decimal)
- **Date Format:** DD/MM/YYYY
- **Currency:** €

**Testing Requirements:**

- [ ] Accented characters render correctly
- [ ] Numbers use French formatting
- [ ] Dates in French format
- [ ] No encoding issues with special characters

---

## Testing Infrastructure

### Tenant Configuration

Language and direction are configured per tenant via `CompanyConfig`:

```typescript
interface CompanyConfig {
  localization: {
    language: "ar" | "en" | "fr";
    region: string; // e.g., "SA", "US", "FR"
    timezone: string; // e.g., "Asia/Riyadh", "America/New_York"
    currency: string; // e.g., "SAR", "USD", "EUR"
  };
}
```

### Test Tenants

| Tenant ID                              | Language | Direction | Config File                                                   |
| -------------------------------------- | -------- | --------- | ------------------------------------------------------------- |
| `22222222-2222-4222-8222-222222222222` | English  | LTR       | `configs/companies/22222222-2222-4222-8222-222222222222.json` |
| `11111111-1111-4111-8111-111111111111` | Arabic   | RTL       | `configs/companies/11111111-1111-4111-8111-111111111111.json` |

### Authentication Tokens

```bash
# English tenant token
export TOKEN_EN=$(
  node scripts/generate-dev-jwt.mjs \
    --tenant 22222222-2222-4222-8222-222222222222
)

# Arabic tenant token
export TOKEN_AR=$(
  node scripts/generate-dev-jwt.mjs \
    --tenant 11111111-1111-4111-8111-111111111111
)
```

---

## Language-Specific Testing

### English (LTR) Testing

#### Test Scenario S1: English Report Generation

```bash
#!/bin/bash
# test_english_ltr.sh

echo "Testing English (LTR) Report Generation"
echo "========================================"

TENANT_ID="22222222-2222-4222-8222-222222222222"
TOKEN=$(
  node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
)

# Trigger report generation
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "'"$TENANT_ID"'",
    "config": {
      "productionFlowScenarioId": "R01"
    }
  }')

EXECUTION_ID=$(echo $RESPONSE | jq -r '.executionId')
echo "Execution ID: $EXECUTION_ID"

# Wait for completion
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION_ID" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Report generation failed"
    exit 1
  fi
  sleep 2
done

echo "English report generated successfully"
```

#### Validation Checklist

- [ ] Report title displays in English
- [ ] Text alignment is left-justified
- [ ] Navigation elements on the left
- [ ] Numbers formatted: 1,234.56
- [ ] Dates in expected format
- [ ] No character encoding issues
- [ ] Font rendering is proper
- [ ] Table headers left-aligned
- [ ] Bullet points render correctly

#### Content Verification

```bash
# Extract text from PDF and verify English content
pdftotext report_S1_*.pdf - | grep -i "agenticverdict"
# Should find English content

# Check for proper English formatting
pdftotext report_S1_*.pdf - | grep -E "[0-9],[0-9]{3}\.[0-9]{2}"
# Should find numbers with comma as thousands separator
```

---

### Arabic (RTL) Testing

#### Test Scenario S2: Arabic RTL Report Generation

```bash
#!/bin/bash
# test_arabic_rtl.sh

echo "Testing Arabic (RTL) Report Generation"
echo "========================================"

TENANT_ID="11111111-1111-4111-8111-111111111111"
TOKEN=$(
  node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
)

# Trigger report generation
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "'"$TENANT_ID"'",
    "config": {
      "productionFlowScenarioId": "R02"
    }
  }')

EXECUTION_ID=$(echo $RESPONSE | jq -r '.executionId')
echo "Execution ID: $EXECUTION_ID"

# Wait for completion
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION_ID" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')

  if [ "$STATUS" = "completed" ]; then
    break
  fi
  sleep 2
done

echo "Arabic report generated successfully"
```

#### Validation Checklist

- [ ] Report title displays in Arabic
- [ ] Text alignment is right-justified
- [ ] Navigation elements on the right
- [ ] Arabic characters render correctly (اختبار)
- [ ] No character clipping
- [ ] Proper ligature formation (لا، 老师، سلام)
- [ ] Diacritical marks visible (فتحة، ضمة، كسرة)
- [ ] Numbers formatted correctly (1,234.56 or ١٢٣٤)
- [ ] Layout properly mirrored
- [ ] Tables render RTL correctly
- [ ] Bullet points on the right

#### Content Verification

```bash
# Extract text and verify Arabic content
pdftotext report_R02_*.pdf - | grep -P "\p{Arabic}"
# Should find Arabic characters

# Check for RTL text flow
pdftotext report_R02_*.pdf - | grep -E "[\u0600-\u06FF]"
# Should match Arabic Unicode range

# Verify no broken characters
pdftotext report_R02_*.pdf - | od -c | grep "\\"
# Should not show broken character sequences
```

---

### French (LTR) Testing

#### Test Scenario: French Report Generation

```bash
#!/bin/bash
# test_french_ltr.sh

echo "Testing French (LTR) Report Generation"
echo "======================================="

TENANT_ID="33333333-3333-4333-8333-333333333333"
TOKEN=$(
  node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
)

# Trigger report generation
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "'"$TENANT_ID"'",
    "config": {
      "language": "fr"
    }
  }')

echo "French report triggered"
```

#### Validation Checklist

- [ ] Accented characters render correctly (é, è, ê, à, ç, œ)
- [ ] Numbers use French format: 1 234,56
- [ ] Dates in DD/MM/YYYY format
- [ ] Currency symbol placement correct
- [ ] No encoding issues with special characters
- [ ] Text flows left to right

#### Content Verification

```bash
# Check for accented characters
pdftotext report_*.pdf - | grep -E "[éèêëàâäùûüôöîïçœ]"
# Should find French accented characters

# Verify French number formatting
pdftotext report_*.pdf - | grep -E "[0-9] [0-9]{3},[0-9]{2}"
# Should find numbers with space thousands separator
```

---

## RTL Validation

### Automated RTL Testing

```bash
#!/bin/bash
# validate_rtl.sh - Validate RTL rendering

validate_rtl_report() {
  local REPORT_FILE=$1

  echo "Validating RTL rendering for: $REPORT_FILE"

  # Extract text from PDF
  local TEXT=$(pdftotext "$REPORT_FILE" - 2>/dev/null)

  # Check for Arabic characters
  if ! echo "$TEXT" | grep -qP "\p{Arabic}"; then
    echo "ERROR: No Arabic characters found"
    return 1
  fi
  echo "✓ Arabic characters present"

  # Check for RTL indicators in HTML (if applicable)
  if [[ "$REPORT_FILE" == *.html ]]; then
    if ! grep -q 'dir="rtl"' "$REPORT_FILE"; then
      echo "ERROR: No RTL direction attribute"
      return 1
    fi
    echo "✓ RTL direction attribute present"
  fi

  # Check for Arabic font
  if [[ "$REPORT_FILE" == *.html ]]; then
    if ! grep -qi "noto.*arabic\|amiri\|cairo" "$REPORT_FILE"; then
      echo "WARNING: No Arabic font specified"
    else
      echo "✓ Arabic font specified"
    fi
  fi

  # Check for common RTL issues
  # 1. Check for mixed LTR/TR text without proper isolation
  if echo "$TEXT" | grep -qP "[A-Za-z]{3,}\s*\p{Arabic}{3,}"; then
    echo "WARNING: Possible mixed LTR/RTL text without isolation"
  fi

  # 2. Check for broken ligatures
  if echo "$TEXT" | grep -qP "ل ا|ل ا"; then
    echo "WARNING: Possible broken Arabic ligatures"
  fi

  echo "✓ RTL validation complete"
  return 0
}

# Usage
# validate_rtl_report "test-output/.../report_R02_*.pdf"
```

### Visual RTL Inspection

```bash
#!/bin/bash
# visual_rtl_check.sh - Manual visual RTL verification

visual_rtl_verification() {
  local REPORT_FILE=$1

  echo "=========================================="
  echo "RTL Visual Verification Checklist"
  echo "=========================================="
  echo ""
  echo "File: $REPORT_FILE"
  echo ""
  echo "Please verify the following:"
  echo ""
  echo "Layout Direction:"
  echo "  [ ] Text starts from the right edge"
  echo "  [ ] Paragraph alignment is right-justified"
  echo "  [ ] Navigation/menu is on the right side"
  echo "  [ ] Scrollbar appears on the left (if applicable)"
  echo ""
  echo "Text Rendering:"
  echo "  [ ] Arabic characters connect properly"
  echo "  [ ] No reversed characters or words"
  echo "  [ ] Diacritical marks are visible"
  echo "  [ ] No character clipping"
  echo ""
  echo "Mixed Content:"
  echo "  [ ] Numbers/English text positioned correctly"
  echo "  [ ] URLs and email addresses readable"
  echo "  [ ] Code snippets render LTR within RTL"
  echo ""
  echo "Tables:"
  echo "  [ ] Table headers on the right"
  echo "  [ ] First column is the rightmost"
  echo "  [ ] Cell content properly aligned"
  echo ""
  echo "Lists:"
  echo "  [ ] Bullet points on the right"
  echo "  [ ] Numbered lists use Arabic-Indic digits (if applicable)"
  echo ""

  # Open file for visual inspection
  if command -v open &>/dev/null; then
    open "$REPORT_FILE"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$REPORT_FILE"
  else
    echo "Please open $REPORT_FILE manually for visual inspection"
  fi
}

# Usage
# visual_rtl_verification "test-output/.../report_R02_*.pdf"
```

---

## Format-Specific Testing

### PDF RTL Testing

```bash
#!/bin/bash
# test_pdf_rtl.sh

test_pdf_rtl() {
  local REPORT_FILE=$1

  echo "Testing PDF RTL rendering..."

  # Extract text
  local TEXT=$(pdftotext "$REPORT_FILE" -)

  # Validate Arabic content
  if ! echo "$TEXT" | grep -qP "\p{Arabic}"; then
    echo "ERROR: No Arabic content in PDF"
    return 1
  fi

  # Check PDF metadata
  local METADATA=$(pdfinfo "$REPORT_FILE" 2>/dev/null)

  # Check for proper embedding
  if ! echo "$METADATA" | grep -qi "encrypted"; then
    echo "✓ PDF is not encrypted"
  fi

  # Verify text direction in PDF
  # This requires specialized PDF inspection tools

  echo "✓ PDF RTL validation complete"
}
```

### HTML RTL Testing

```bash
#!/bin/bash
# test_html_rtl.sh

test_html_rtl() {
  local HTML_FILE=$1

  echo "Testing HTML RTL rendering..."

  # Check for RTL direction attribute
  if ! grep -q 'dir="rtl"' "$HTML_FILE"; then
    echo "ERROR: Missing dir=\"rtl\" attribute"
    return 1
  fi
  echo "✓ RTL direction attribute present"

  # Check for lang attribute
  if ! grep -q 'lang="ar"' "$HTML_FILE"; then
    echo "WARNING: Missing lang=\"ar\" attribute"
  fi

  # Check for Arabic font
  if ! grep -qi "font-family.*arabic\|noto.*arabic" "$HTML_FILE"; then
    echo "WARNING: No Arabic font specified"
  fi

  # Check for RTL-specific CSS
  local RTL_CSS="text-align.*right|direction.*rtl|border-right"
  if ! grep -qiE "$RTL_CSS" "$HTML_FILE"; then
    echo "WARNING: Limited RTL-specific CSS"
  fi

  # Validate HTML structure
  if command -v tidy &>/dev/null; then
    tidy -eq "$HTML_FILE" 2>/dev/null
  fi

  echo "✓ HTML RTL validation complete"
}
```

### DOCX RTL Testing

```bash
#!/bin/bash
# test_docx_rtl.sh

test_docx_rtl() {
  local DOCX_FILE=$1

  echo "Testing DOCX RTL rendering..."

  # Extract document.xml
  local DOC_XML=$(unzip -p "$DOCX_FILE" word/document.xml)

  # Check for RTL direction
  if ! echo "$DOC_XML" | grep -qi "w:bidi"; then
    echo "WARNING: No bidirectional settings found"
  fi

  # Check for RTL text direction
  if ! echo "$DOC_XML" | grep -qi "w:textDirection.*rtl"; then
    echo "WARNING: No explicit RTL text direction"
  fi

  # Check for Arabic font
  if ! echo "$DOC_XML" | grep -qi "cairo|amiri|noto.*arabic"; then
    echo "WARNING: No Arabic font specified in document"
  fi

  # Verify document structure
  if ! unzip -t "$DOCX_FILE" &>/dev/null; then
    echo "ERROR: Invalid DOCX file"
    return 1
  fi

  echo "✓ DOCX RTL validation complete"
}
```

---

## Localization Testing

### Date/Time Formatting

```bash
#!/bin/bash
# test_localization_dates.sh

test_date_formatting() {
  local LANGUAGE=$1
  local REPORT_FILE=$2

  echo "Testing date formatting for $LANGUAGE..."

  local TEXT=$(pdftotext "$REPORT_FILE" -)

  case $LANGUAGE in
    en)
      # Check for MM/DD/YYYY or DD/MM/YYYY
      if echo "$TEXT" | grep -qE "[0-9]{2}/[0-9]{2}/[0-9]{4}"; then
        echo "✓ Date format detected (English)"
      fi
      ;;
    ar)
      # Check for DD/MM/YYYY or Arabic date
      if echo "$TEXT" | grep -qE "[0-9]{2}/[0-9]{2}/[0-9]{4}"; then
        echo "✓ Date format detected (Arabic)"
      fi
      ;;
    fr)
      # Check for DD/MM/YYYY
      if echo "$TEXT" | grep -qE "[0-9]{2}/[0-9]{2}/[0-9]{4}"; then
        echo "✓ Date format detected (French)"
      fi
      ;;
  esac
}
```

### Number/Currency Formatting

```bash
#!/bin/bash
# test_localization_numbers.sh

test_number_formatting() {
  local LANGUAGE=$1
  local REPORT_FILE=$2

  echo "Testing number formatting for $LANGUAGE..."

  local TEXT=$(pdftotext "$REPORT_FILE" -)

  case $LANGUAGE in
    en)
      # 1,234.56
      if echo "$TEXT" | grep -qE "[0-9],[0-9]{3}\.[0-9]{2}"; then
        echo "✓ English number format detected"
      fi
      ;;
    ar)
      # 1,234.56 or ١٢٣٤
      if echo "$TEXT" | grep -qE "[0-9],[0-9]{3}\.[0-9]{2}|[٠-٩]"; then
        echo "✓ Arabic number format detected"
      fi
      ;;
    fr)
      # 1 234,56
      if echo "$TEXT" | grep -qE "[0-9] [0-9]{3},[0-9]{2}"; then
        echo "✓ French number format detected"
      fi
      ;;
  esac
}
```

---

## Multi-Language Test Suite

### Complete Localization Test

```bash
#!/bin/bash
# test_all_languages.sh

test_all_languages() {
  local TEST_RUN_DIR="test-output/archive/$(date +%Y-%m-%d)_localization-test"
  mkdir -p "$TEST_RUN_DIR"/{en_ltr,ar_rtl,fr_ltr}

  echo "=========================================="
  echo "Multi-Language Test Suite"
  echo "=========================================="
  echo ""

  # Test English
  echo "Testing English (LTR)..."
  ./test_english_ltr.sh
  # Move reports to localization directory
  # Run validation

  # Test Arabic
  echo "Testing Arabic (RTL)..."
  ./test_arabic_rtl.sh
  # Move reports to localization directory
  # Run validation

  # Test French
  echo "Testing French (LTR)..."
  ./test_french_ltr.sh
  # Move reports to localization directory
  # Run validation

  # Generate comparison report
  echo ""
  echo "Localization test complete"
  echo "Reports saved to: $TEST_RUN_DIR"
}
```

---

## Troubleshooting

### Common RTL Issues

| Issue                  | Symptom                               | Solution                                                   |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Text appears reversed  | Characters show LTR instead of RTL    | Check `dir="rtl"` attribute; verify CSS direction property |
| Broken ligatures       | Arabic letters don't connect          | Ensure proper Arabic font is loaded; check font fallback   |
| Mixed direction issues | Numbers/English text misplaced        | Use Unicode bidirectional control characters               |
| Character clipping     | Text cut off at edges                 | Check padding/margins for RTL layout                       |
| Wrong alignment        | Content left-aligned instead of right | Verify text-align: right for RTL                           |

### Debugging Commands

```bash
# Check for RTL attributes in HTML
grep -r 'dir="rtl"' test-output/

# Find Arabic characters in files
grep -rP "\p{Arabic}" test-output/

# Extract and display PDF text for inspection
pdftotext report.pdf | less

# Check font usage in HTML
grep -r "font-family" test-output/ | grep -i arabic
```

---

**End of Document**

For integration with the main manual testing guide, see `manual-testing-guide.md`.
