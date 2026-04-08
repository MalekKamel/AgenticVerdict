import type { FormatGeneratorInput, IFormatGenerator } from "./types";

export class JsonFormatGenerator implements IFormatGenerator {
  readonly format = "json" as const;

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    const payload = {
      context: input.context,
      model: input.model,
      renderedTemplate: input.renderedTemplate,
    };
    return new TextEncoder().encode(JSON.stringify(payload, null, 2));
  }
}
