import * as vscode from "vscode";

const dartPackageImportRegex =
    /import\s+['"]package:([^\/'"]+)\/[^'"]+['"]\s*;/gm;

export function collectDartDiagnostics(
    document: vscode.TextDocument,
    workspacePath: string,
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    const pkgs = new Map<string, vscode.Range[]>();
    let match: RegExpExecArray | null;

    while ((match = dartPackageImportRegex.exec(text)) !== null) {
        const pkg = match[1];
        addOccurrence(document, pkgs, pkg, match.index, match[0].length);
    }

    for (const [pkg, ranges] of pkgs.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(
                range,
                `Dart dependency "${pkg}" may not be added (dart pub add).`,
                vscode.DiagnosticSeverity.Warning,
            );
            (diag as any).code = {
                value: "missingDeps",
                moduleName: pkg,
                workspacePath,
                language: "dart",
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
