import type { ZodError } from "zod";

function formatZodIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("\n");
}

export class ConfigValidationError extends Error {
  readonly zodError: ZodError;

  constructor(message: string, zodError: ZodError) {
    super(message);
    this.name = "ConfigValidationError";
    this.zodError = zodError;
  }
}

export function configValidationErrorFromZod(zodError: ZodError): ConfigValidationError {
  const detail = formatZodIssues(zodError);
  return new ConfigValidationError(`Invalid tenant configuration:\n${detail}`, zodError);
}
