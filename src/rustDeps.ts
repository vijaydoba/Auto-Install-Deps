import * as vscode from "vscode";

const rustExternRegex = /^\s*extern\s+crate\s+([A-Za-z0-9_]+)\s*;/gm;
const rustUseRegex = /^\s*use\s+([^;]+);/gm;

const RUST_SKIP_ROOTS = new Set([
    "crate",
    "self",
    "super",
    "std",
    "core",
    "alloc",
]);

export function collectRustDiagnostics(
    document: vscode.TextDocument,
    workspacePath: string,
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    const crates = new Map<string, vscode.Range[]>();
    let match: RegExpExecArray | null;

    while ((match = rustExternRegex.exec(text)) !== null) {
        const crate = match[1];
        addOccurrence(document, crates, crate, match.index, match[0].length);
    }

    while ((match = rustUseRegex.exec(text)) !== null) {
        const path = match[1].trim(); // e.g. serde::Serialize
        const root = path.split("::")[0];
        if (!root || RUST_SKIP_ROOTS.has(root)) continue;
        addOccurrence(document, crates, root, match.index, match[0].length);
    }

    for (const [crate, ranges] of crates.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(
                range,
                `Rust dependency "${crate}" may not be in Cargo.toml (cargo add).`,
                vscode.DiagnosticSeverity.Warning,
            );
            (diag as any).code = {
                value: "missingDeps",
                moduleName: crate,
                workspacePath,
                language: "rust",
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
