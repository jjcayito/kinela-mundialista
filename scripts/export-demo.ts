import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildExcelBuffer } from "../src/lib/export-excel";

const outputDir = join(process.cwd(), "exports");
mkdirSync(outputDir, { recursive: true });

const filePath = join(outputDir, "kinela-mundialista-demo.xlsx");
writeFileSync(filePath, buildExcelBuffer());

console.log(`Excel generado: ${filePath}`);
