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
exports.collectCsharpDiagnostics = collectCsharpDiagnostics;
const vscode = __importStar(require("vscode"));
const csharpUsingRegex = /^\s*using\s+([A-Za-z0-9_.]+)\s*;/gm;
function collectCsharpDiagnostics(document, workspacePath) {
    const diagnostics = [];
    const text = document.getText();
    const usedPackages = new Map();
    let match;
    while ((match = csharpUsingRegex.exec(text)) !== null) {
        const ns = match[1]; // e.g. MyCompany.MyLib
        if (ns.startsWith("System.") || ns.startsWith("Microsoft."))
            continue;
        const parts = ns.split(".");
        const packageName = parts[0]; // very rough guess
        addOccurrence(document, usedPackages, packageName, match.index, match[0].length);
    }
    for (const [pkg, ranges] of usedPackages.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(range, `C# dependency "${pkg}" may not be referenced (NuGet).`, vscode.DiagnosticSeverity.Warning);
            diag.code = {
                value: "missingDeps",
                moduleName: pkg,
                workspacePath,
                language: "csharp",
            };
            diagnostics.push(diag);
        }
    }
    return diagnostics;
}
function addOccurrence(document, map, name, index, length) {
    const start = document.positionAt(index);
    const end = document.positionAt(index + length);
    const range = new vscode.Range(start, end);
    const existing = map.get(name) || [];
    existing.push(range);
    map.set(name, existing);
}
//# sourceMappingURL=csharpDeps.js.map