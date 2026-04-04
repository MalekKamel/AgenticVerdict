import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { zodToJsonSchema } from "zod-to-json-schema";

import { companyConfigSchema } from "../src/schemas/company";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const jsonSchema = zodToJsonSchema(companyConfigSchema, {
  name: "CompanyConfig",
  $refStrategy: "none",
});

const markdown = `# CompanyConfig schema (generated)

Do not edit by hand. Regenerate with \`pnpm --filter @agenticverdict/config run generate:schema-doc\`.

\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\`
`;

const outArgIdx = process.argv.indexOf("--out");
const outPath =
  outArgIdx >= 0 && process.argv[outArgIdx + 1]
    ? path.resolve(process.cwd(), process.argv[outArgIdx + 1]!)
    : path.join(__dirname, "..", "generated", "company-config.schema.md");

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, markdown, "utf-8");
process.stdout.write(`Wrote ${outPath}\n`);
