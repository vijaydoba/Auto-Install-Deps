"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectJavaDiagnostics = collectJavaDiagnostics;
const vscode = __importStar(require("vscode"));
// Java imports
const javaImportRegex = /^\s*import\s+([a-zA-Z0-9_.]+);/gm;
/**
 * JAVA: simple scan of import lines, offer mvn command.
 * This does NOT really know the correct Maven coordinates.
 */
function collectJavaDiagnostics(document, workspacePath) {
    const diagnostics = [];
    const text = document.getText();
    const usedModules = new Map();
    let match;
    while ((match = javaImportRegex.exec(text)) !== null) {
        const fullImport = match[1]; // e.g. org.slf4j.Logger
        // Skip standard Java packages
        if (fullImport.startsWith("java.") ||
            fullImport.startsWith("javax.") ||
            fullImport.startsWith("jakarta.")) {
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
        addModuleOccurrence(document, usedModules, guessedArtifact, match.index, match[0].length);
    }
    for (const [artifact, ranges] of usedModules.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(range, `Java dependency "${artifact}" may not be available (Maven).`, vscode.DiagnosticSeverity.Warning);
            diag.code = {
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
function addModuleOccurrence(document, usedModules, moduleName, index, length) {
    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + length);
    const range = new vscode.Range(startPos, endPos);
    const existing = usedModules.get(moduleName) || [];
    existing.push(range);
    usedModules.set(moduleName, existing);
}
//# sourceMappingURL=javaDeps.js.map