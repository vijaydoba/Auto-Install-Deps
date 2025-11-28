import * as vscode from "vscode";

// Java imports
const javaImportRegex = /^\s*import\s+([a-zA-Z0-9_.]+);/gm;

/**
 * JAVA: simple scan of import lines, offer mvn command.
 * This does NOT really know the correct Maven coordinates.
 */
export function collectJavaDiagnostics(
    document: vscode.TextDocument,
    workspacePath: string,
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    const usedModules = new Map<string, vscode.Range[]>();
    let match: RegExpExecArray | null;

    while ((match = javaImportRegex.exec(text)) !== null) {
        const fullImport = match[1]; // e.g. org.slf4j.Logger

        // Skip standard Java packages
        if (
            fullImport.startsWith("java.") ||
            fullImport.startsWith("javax.") ||
            fullImport.startsWith("jakarta.")
        ) {
            continue;
        }

        // Guess groupId:artifactId from import
        const parts = fullImport.split(".");
        if (parts.length < 2) {
            continue;
        }
        const artifactId = parts[parts.length - 1];
        const groupId = parts.slice(0, parts.length - 1).join(".");
        const guessedArtifact = `${groupId}:${artifactId}:LATEST`;

        addModuleOccurrence(
            document,
            usedModules,
            guessedArtifact,
            match.index,
            match[0].length,
        );
    }

    for (const [artifact, ranges] of usedModules.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(
                range,
                `Java dependency "${artifact}" may not be available (Maven).`,
                vscode.DiagnosticSeverity.Warning,
            );
            (diag as any).code = {
                value: "missingDeps",
                moduleName: artifact,
                workspacePath,
                language: "java",
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
