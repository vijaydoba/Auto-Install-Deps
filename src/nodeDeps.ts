import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Node / JS / TS imports
const importRegex = /import\s+(?:.+?\s+from\s+)?["']([^"']+)["']/g;
const requireRegex = /require\(\s*["']([^"']+)["']\s*\)/g;

/**
 * Node.js core modules to ignore.
 */
const NODE_CORE_MODULES = new Set([
    "fs",
    "path",
    "http",
    "https",
    "url",
    "os",
    "crypto",
    "util",
    "stream",
    "events",
    "buffer",
    "zlib",
    "net",
    "tls",
    "dns",
    "readline",
    "child_process",
    "cluster",
    "assert",
    "timers",
]);

function isNodeCoreModule(name: string): boolean {
    if (name.startsWith("node:")) {
        name = name.slice(5);
    }
    return NODE_CORE_MODULES.has(name);
}

/**
 * NODE / JS / TS: use node_modules to decide if installed.
 */
export function collectNodeDiagnostics(
    document: vscode.TextDocument,
    workspacePath: string,
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const nodeModulesPath = path.join(workspacePath, "node_modules");
    const text = document.getText();

    const usedModules = new Map<string, vscode.Range[]>();
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(text)) !== null) {
        const moduleName = match[1];
        addModuleOccurrence(
            document,
            usedModules,
            moduleName,
            match.index,
            match[0].length,
        );
    }

    while ((match = requireRegex.exec(text)) !== null) {
        const moduleName = match[1];
        addModuleOccurrence(
            document,
            usedModules,
            moduleName,
            match.index,
            match[0].length,
        );
    }

    for (const [moduleName, ranges] of usedModules.entries()) {
        if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
            continue;
        }

        if (isNodeCoreModule(moduleName)) {
            continue;
        }

        const installed = isModuleInstalled(nodeModulesPath, moduleName);
        if (installed) {
            continue;
        }

        for (const range of ranges) {
            const diag = new vscode.Diagnostic(
                range,
                `Dependency "${moduleName}" is not installed in node_modules.`,
                vscode.DiagnosticSeverity.Warning,
            );
            (diag as any).code = {
                value: "missingDeps",
                moduleName,
                workspacePath,
                language: "node",
            };
            diagnostics.push(diag);
        }
    }

    return diagnostics;
}

function addModuleOccurrence(
    document: vscode.TextDocument,
    usedModules: Map<string, vscode.Range[]>,
    moduleName: string,
    index: number,
    length: number,
) {
    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + length);
    const range = new vscode.Range(startPos, endPos);

    const existing = usedModules.get(moduleName) || [];
    existing.push(range);
    usedModules.set(moduleName, existing);
}

/**
 * Check if module is installed in node_modules.
 * Supports scoped packages like @scope/name.
 */
function isModuleInstalled(
    nodeModulesPath: string,
    moduleName: string,
): boolean {
    const segments = moduleName.split("/");
    const modulePath = path.join(nodeModulesPath, ...segments);
    return fs.existsSync(modulePath);
}
