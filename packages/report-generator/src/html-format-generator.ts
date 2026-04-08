import type { FormatGeneratorInput, IFormatGenerator } from "./types";

export class HtmlFormatGenerator implements IFormatGenerator {
  readonly format = "html" as const;

  async generate(input: FormatGeneratorInput): Promise<Uint8Array> {
    return new TextEncoder().encode(input.renderedTemplate);
  }
}
