/**
 * Maps validation error codes from zod schemas to i18n translation keys.
 */

const ERROR_CODE_MAP: Record<string, string> = {
  NAME_TOO_SHORT: "wizard.validation.nameTooShort",
  NAME_TOO_LONG: "wizard.validation.nameTooLong",
  DOMAIN_REQUIRED: "wizard.validation.domainRequired",
  CONNECTOR_REQUIRED: "wizard.validation.connectorRequired",
  MODEL_REQUIRED: "wizard.validation.modelRequired",
  DETAIL_LEVEL_REQUIRED: "wizard.validation.detailLevelRequired",
  FREQUENCY_REQUIRED: "wizard.validation.frequencyRequired",
  TIME_REQUIRED: "wizard.validation.timeRequired",
  FORMAT_REQUIRED: "wizard.validation.formatRequired",
  EMAIL_INVALID: "wizard.validation.emailInvalid",
  WEBHOOK_URL_REQUIRED: "wizard.validation.webhookUrlRequired",
  WEBHOOK_URL_INVALID: "wizard.validation.webhookUrlInvalid",
};

export function getValidationMessage(code: string, t: (key: string) => string): string {
  const i18nKey = ERROR_CODE_MAP[code];
  if (i18nKey) {
    return t(i18nKey);
  }
  return code;
}
