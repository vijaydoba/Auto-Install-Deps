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
exports.collectRubyDiagnostics = collectRubyDiagnostics;
const vscode = __importStar(require("vscode"));
const rubyRequireRegex = /^\s*require\s+["']([^"']+)["']/gm;
function collectRubyDiagnostics(document, workspacePath) {
    const diagnostics = [];
    const text = document.getText();
    const gems = new Map();
    let match;
    while ((match = rubyRequireRegex.exec(text)) !== null) {
        const gem = match[1];
        addOccurrence(document, gems, gem, match.index, match[0].length);
    }
    for (const [gem, ranges] of gems.entries()) {
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(range, `Ruby dependency "${gem}" may not be installed (Bundler).`, vscode.DiagnosticSeverity.Warning);
            diag.code = {
                value: "missingDeps",
                moduleName: gem,
                workspacePath,
                language: "ruby",
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
//# sourceMappingURL=rubyDeps.js.map