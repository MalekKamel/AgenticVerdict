# CompanyConfig schema (generated)

Do not edit by hand. Regenerate with `pnpm --filter @agenticverdict/config run generate:schema-doc`.

```json
{
  "$ref": "#/definitions/CompanyConfig",
  "definitions": {
    "CompanyConfig": {
      "type": "object",
      "properties": {
        "companyId": {
          "type": "string",
          "format": "uuid"
        },
        "companyName": {
          "type": "string",
          "minLength": 1
        },
        "localization": {
          "type": "object",
          "properties": {
            "language": {
              "type": "string",
              "enum": ["ar", "en", "fr"]
            },
            "region": {
              "type": "string",
              "minLength": 1
            },
            "timezone": {
              "type": "string",
              "minLength": 1
            },
            "currency": {
              "type": "string",
              "minLength": 1
            }
          },
          "required": ["language", "region", "timezone", "currency"],
          "additionalProperties": false
        },
        "marketing": {
          "type": "object",
          "properties": {
            "channels": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "platform": {
                    "type": "string",
                    "enum": ["meta", "ga4", "gsc", "gbp", "tiktok"]
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "label": {
                    "type": "string",
                    "minLength": 1
                  },
                  "credentialsRef": {
                    "type": "string",
                    "minLength": 1
                  },
                  "settings": {
                    "type": "object",
                    "additionalProperties": {
                      "type": ["string", "number", "boolean"]
                    }
                  }
                },
                "required": ["platform", "enabled"],
                "additionalProperties": false
              }
            },
            "kpis": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "minLength": 1
                  },
                  "name": {
                    "type": "string",
                    "minLength": 1
                  },
                  "description": {
                    "type": "string",
                    "minLength": 1
                  },
                  "unit": {
                    "type": "string",
                    "minLength": 1
                  }
                },
                "required": ["id", "name"],
                "additionalProperties": false
              }
            }
          },
          "required": ["channels"],
          "additionalProperties": false
        },
        "ai": {
          "type": "object",
          "properties": {
            "primaryModel": {
              "type": "string",
              "minLength": 1
            },
            "provider": {
              "type": "string",
              "enum": ["anthropic", "openai"]
            }
          },
          "required": ["primaryModel", "provider"],
          "additionalProperties": false
        },
        "features": {
          "type": "object",
          "properties": {
            "enableInsights": {
              "type": "boolean"
            },
            "enableVerdict": {
              "type": "boolean"
            }
          },
          "required": ["enableInsights", "enableVerdict"],
          "additionalProperties": false
        },
        "business": {
          "type": "object",
          "properties": {
            "products": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "valueProps": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "differentiators": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": ["products", "valueProps", "differentiators"],
          "additionalProperties": false
        }
      },
      "required": ["companyId", "companyName", "localization", "marketing", "ai", "features"],
      "additionalProperties": false
    }
  },
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```
