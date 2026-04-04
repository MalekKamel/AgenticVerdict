export type AgentToolErrorCode =
  | "validation_failed"
  | "execution_failed"
  | "tenant_context_required";

export class AgentToolError extends Error {
  readonly code: AgentToolErrorCode;
  override readonly cause?: unknown;

  constructor(
    code: AgentToolErrorCode,
    message: string,
    options: {
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "AgentToolError";
    this.code = code;
    this.cause = options.cause;
  }
}
