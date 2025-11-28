import * as vscode from "vscode";

// Python imports
const pythonImportRegex = /^\s*import\s+([a-zA-Z0-9_]+)/gm;
const pythonFromImportRegex = /^\s*from\s+([a-zA-Z0-9_\.]+)\s+import\s+/gm;

/**
 * PYTHON: very simple - scan import lines, always offer pip install.
 * This does NOT really check if the module is installed.
 */
export function collectPythonDiagnostics(
    document: vscode.TextDocument,
    workspacePath: string,
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    const usedModules = new Map<string, vscode.Range[]>();
    let match: RegExpExecArray | null;

    // "import requests"
    while ((match = pythonImportRegex.exec(text)) !== null) {
        const moduleName = match[1];
        addModuleOccurrence(
            document,
            usedModules,
            moduleName,
            match.index,
            match[0].length,
        );
    }

    // "from requests import get" -> root package "requests"
    while ((match = pythonFromImportRegex.exec(text)) !== null) {
        const full = match[1];
        const root = full.split(".")[0];
        addModuleOccurrence(
            document,
            usedModules,
            root,
            match.index,
            match[0].length,
        );
    }

    for (const [moduleName, ranges] of usedModules.entries()) {
        // basic: skip relative imports
        if (moduleName.startsWith(".")) {
            continue;
        }

        for (const range of ranges) {
            const diag = new vscode.Diagnostic(
                range,
                `Python dependency "${moduleName}" may not be installed (pip).`,
                vscode.DiagnosticSeverity.Warning,
            );
            (diag as any).code = {
                value: "missingDeps",
                moduleName,
                workspacePath,
                language: "python",
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
