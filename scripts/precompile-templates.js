import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";        // полная версия с компилятором
import { glob } from "glob";
import { registerHelpers } from "../src/web/client/js/utils/handlebars-helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Путь к папке с исходными шаблонами
const TEMPLATES_DIR = path.resolve(__dirname, "../src/web/client/templates");
// Выходной файл, который будет импортироваться приложением
const OUTPUT_FILE = path.resolve(__dirname, "../src/web/client/js/generated/templates.js");

// Регистрируем хелперы (нужны для корректной прекомпиляции)
registerHelpers(Handlebars);

async function precompile() {
  console.log("🔨 Precompiling Handlebars templates...");

  // Находим все .hbs файлы рекурсивно
  const files = await glob("**/*.hbs", { cwd: TEMPLATES_DIR });

  // Отделяем партиалы от обычных шаблонов
  const partials = files.filter(f => f.includes("partials/"));
  const templates = files.filter(f => !f.includes("partials/"));

  let output = `// GENERATED FILE – DO NOT EDIT
// Precompiled Handlebars templates
import Handlebars from "handlebars/runtime";
import { registerHelpers } from "../utils/handlebars-helpers.js";

// Регистрируем хелперы один раз
registerHelpers(Handlebars);

// ========== PARTIALS ==========
`;

  // Компилируем и регистрируем партиалы
  for (const file of partials) {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf-8");
    const name = path.basename(file, ".hbs");
    const precompiled = Handlebars.precompile(content);
    output += `Handlebars.registerPartial("${name}", Handlebars.template(${precompiled}));\n`;
  }

  output += `\n// ========== TEMPLATES ==========
export const Templates = {
`;

  // Компилируем обычные шаблоны и кладём в объект Templates
  for (const file of templates) {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf-8");
    const precompiled = Handlebars.precompile(content);
    // Ключ – путь без расширения, например "layouts/main", "modals/login"
    const templateName = file.replace(/\.hbs$/, "");
    output += `  "${templateName}": Handlebars.template(${precompiled}),\n`;
  }

  output += `};\n`;

  // Убеждаемся, что папка generated существует
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Precompiled ${files.length} templates to ${OUTPUT_FILE}`);
}

precompile().catch(console.error);