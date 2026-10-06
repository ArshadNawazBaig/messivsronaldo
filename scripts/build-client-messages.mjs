import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

// Keep the complete server catalogs. Ship only messages reachable from client
// components, plus parameterized messages used by runtime-generated data.
const root = process.cwd();
const sourceRoot = path.join(root, "src");
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}
const sources = files(sourceRoot).filter(filename => /\.tsx?$/.test(filename));
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const visited = new Set();
const strings = new Set();
function collectJson(value) {
  if (typeof value === "string") strings.add(value.trim().toLowerCase());
  else if (value && typeof value === "object") Object.values(value).forEach(collectJson);
}
function visit(filename, followImports = true) {
  if (visited.has(filename) || !filename.startsWith(sourceRoot + path.sep)) return;
  // Catalogs and this output cannot become evidence for their own inclusion.
  if (/[/\\]i18n[/\\](?:messages|article-messages)[/\\]/.test(filename) || filename.endsWith("client-message-keys.json")) return;
  visited.add(filename);
  const text = readFileSync(filename, "utf8");
  if (filename.endsWith(".json")) { collectJson(JSON.parse(text)); return; }
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  function dependency(specifier) {
    if (!followImports) return;
    const resolved = ts.resolveModuleName(specifier, filename, options, ts.sys).resolvedModule;
    if (resolved) visit(resolved.resolvedFileName);
  }
  function walk(node) {
    if (ts.isStringLiteralLike(node)) strings.add(node.text.trim().toLowerCase());
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const bindings = node.importClause?.namedBindings;
      const onlyTypes = node.isTypeOnly || node.importClause?.isTypeOnly ||
        (bindings && ts.isNamedImports(bindings) && !node.importClause?.name && bindings.elements.length > 0 && bindings.elements.every(item => item.isTypeOnly));
      if (!onlyTypes && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) dependency(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) dependency(node.arguments[0].text);
    ts.forEachChild(node, walk);
  }
  walk(source);
}
for (const filename of sources) {
  const source = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
  if (source.statements.some(statement => ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === "use client")) visit(filename);
}
// These server producers pass untranslated dataset labels to client controls.
visit(path.join(sourceRoot, "lib/published-data.ts"));
// This server component supplies chart titles and notes as untranslated props.
// Its database/article imports stay outside the client message dependency set.
visit(path.join(sourceRoot, "components/award-comparison.tsx"), false);
const catalog = JSON.parse(readFileSync(path.join(sourceRoot, "lib/i18n/messages/en.json"), "utf8"));
const keys = Object.keys(catalog).filter(key => strings.has(key.trim().toLowerCase()) || /\{\d+\}/.test(key)).sort();
const output = path.join(sourceRoot, "lib/i18n/client-message-keys.json");
const generated = JSON.stringify(keys, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== generated) throw new Error("Client message manifest is stale. Run npm run i18n:client.");
} else if (!ts.sys.fileExists(output) || readFileSync(output, "utf8") !== generated) {
  writeFileSync(output, generated);
}
console.log(`Client translations: ${keys.length}/${Object.keys(catalog).length} messages; full catalogs retained on the server.`);
