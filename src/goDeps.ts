import * as vscode from "vscode";

const goSingleImportRegex = /^\s*import\s+"([^"]+)"/gm;
const goBlockImportRegex = /^\s*import\s*\(([\s\S]*?)\)/gm;

export function collectGoDiagnostics(
    document: vscode.TextDocument,
    workspacePath: string,
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    const usedModules = new Map<string, vscode.Range[]>();
    let match: RegExpExecArray | null;

    // single-line imports: import "module/path"
    while ((match = goSingleImportRegex.exec(text)) !== null) {
        const mod = match[1];
        addOccurrence(document, usedModules, mod, match.index, match[0].length);
    }

    // block imports: import ( "a" "b" )
    while ((match = goBlockImportRegex.exec(text)) !== null) {
        const block = match[1]; // inside (...)
        let inner: RegExpExecArray | null;
        const innerRegex = /"([^"]+)"/g;
        while ((inner = innerRegex.exec(block)) !== null) {
            const mod = inner[1];
            // approximate index for range (not perfect, but ok)
            const index = match.index + inner.index;
            addOccurrence(document, usedModules, mod, index, inner[0].length);
        }
    }

    for (const [mod, ranges] of usedModules.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(
                range,
                `Go dependency "${mod}" may not be installed (go get).`,
                vscode.DiagnosticSeverity.Warning,
            );
            (diag as any).code = {
                value: "missingDeps",
                moduleName: mod,
                workspacePath,
                language: "go",
            };
            diagnostics.push(diag);
        }
    }

    return diagnostics;
}

function addOccurrence(
    document: vscode.TextDocument,
    map: Map<string, vscode.Range[]>,
    name: string,
    index: number,
    length: number,
) {
    const start = document.positionAt(index);
    const end = document.positionAt(index + length);
    const range = new vscode.Range(start, end);
    const existing = map.get(name) || [];
    existing.push(range);
    map.set(name, existing);
}
