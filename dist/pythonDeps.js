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
exports.collectPythonDiagnostics = collectPythonDiagnostics;
const vscode = __importStar(require("vscode"));
// Python imports
const pythonImportRegex = /^\s*import\s+([a-zA-Z0-9_]+)/gm;
const pythonFromImportRegex = /^\s*from\s+([a-zA-Z0-9_\.]+)\s+import\s+/gm;
/**
 * PYTHON: very simple - scan import lines, always offer pip install.
 * This does NOT really check if the module is installed.
 */
function collectPythonDiagnostics(document, workspacePath) {
    const diagnostics = [];
    const text = document.getText();
    const usedModules = new Map();
    let match;
    // "import requests"
    while ((match = pythonImportRegex.exec(text)) !== null) {
        const moduleName = match[1];
        addModuleOccurrence(document, usedModules, moduleName, match.index, match[0].length);
    }
    // "from requests import get" -> root package "requests"
    while ((match = pythonFromImportRegex.exec(text)) !== null) {
        const full = match[1];
        const root = full.split(".")[0];
        addModuleOccurrence(document, usedModules, root, match.index, match[0].length);
    }
    for (const [moduleName, ranges] of usedModules.entries()) {
        // basic: skip relative imports
        if (moduleName.startsWith(".")) {
            continue;
        }
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(range, `Python dependency "${moduleName}" may not be installed (pip).`, vscode.DiagnosticSeverity.Warning);
            diag.code = {
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
function addModuleOccurrence(document, usedModules, moduleName, index, length) {
    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + length);
    const range = new vscode.Range(startPos, endPos);
    const existing = usedModules.get(moduleName) || [];
    existing.push(range);
    usedModules.set(moduleName, existing);
}
//# sourceMappingURL=pythonDeps.js.map