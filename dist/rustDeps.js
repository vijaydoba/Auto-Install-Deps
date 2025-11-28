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
exports.collectRustDiagnostics = collectRustDiagnostics;
const vscode = __importStar(require("vscode"));
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
function collectRustDiagnostics(document, workspacePath) {
    const diagnostics = [];
    const text = document.getText();
    const crates = new Map();
    let match;
    while ((match = rustExternRegex.exec(text)) !== null) {
        const crate = match[1];
        addOccurrence(document, crates, crate, match.index, match[0].length);
    }
    while ((match = rustUseRegex.exec(text)) !== null) {
        const path = match[1].trim(); // e.g. serde::Serialize
        const root = path.split("::")[0];
        if (!root || RUST_SKIP_ROOTS.has(root))
            continue;
        addOccurrence(document, crates, root, match.index, match[0].length);
    }
    for (const [crate, ranges] of crates.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(range, `Rust dependency "${crate}" may not be in Cargo.toml (cargo add).`, vscode.DiagnosticSeverity.Warning);
            diag.code = {
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
function addOccurrence(document, map, name, index, length) {
    const start = document.positionAt(index);
    const end = document.positionAt(index + length);
    const range = new vscode.Range(start, end);
    const existing = map.get(name) || [];
    existing.push(range);
    map.set(name, existing);
}
//# sourceMappingURL=rustDeps.js.map