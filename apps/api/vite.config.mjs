import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createNodeCliConfig } from "../../tools/build/vite-node-cli.config.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
export default createNodeCliConfig(dir);
