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
exports.collectNodeDiagnostics = collectNodeDiagnostics;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Node / JS / TS imports
const importRegex = /import\s+(?:.+?\s+from\s+)?["']([^"']+)["']/g;
const requireRegex = /require\(\s*["']([^"']+)["']\s*\)/g;
/**
 * Node.js core modules to ignore.
 */
const NODE_CORE_MODULES = new Set([
    "fs",
    "path",
    "http",
    "https",
    "url",
    "os",
    "crypto",
    "util",
    "stream",
    "events",
    "buffer",
    "zlib",
    "net",
    "tls",
    "dns",
    "readline",
    "child_process",
    "cluster",
    "assert",
    "timers",
]);
function isNodeCoreModule(name) {
    if (name.startsWith("node:")) {
        name = name.slice(5);
    }
    return NODE_CORE_MODULES.has(name);
}
/**
 * NODE / JS / TS: use node_modules to decide if installed.
 */
function collectNodeDiagnostics(document, workspacePath) {
    const diagnostics = [];
    const nodeModulesPath = path.join(workspacePath, "node_modules");
    const text = document.getText();
    const usedModules = new Map();
    let match;
    while ((match = importRegex.exec(text)) !== null) {
        const moduleName = match[1];
        addModuleOccurrence(document, usedModules, moduleName, match.index, match[0].length);
    }
    while ((match = requireRegex.exec(text)) !== null) {
        const moduleName = match[1];
        addModuleOccurrence(document, usedModules, moduleName, match.index, match[0].length);
    }
    for (const [moduleName, ranges] of usedModules.entries()) {
        if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
            continue;
        }
        if (isNodeCoreModule(moduleName)) {
            continue;
        }
        const installed = isModuleInstalled(nodeModulesPath, moduleName);
        if (installed) {
            continue;
        }
        for (const range of ranges) {
            const diag = new vscode.Diagnostic(range, `Dependency "${moduleName}" is not installed in node_modules.`, vscode.DiagnosticSeverity.Warning);
            diag.code = {
                value: "missingDeps",
                moduleName,
                workspacePath,
                language: "node",
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
/**
 * Check if module is installed in node_modules.
 * Supports scoped packages like @scope/name.
 */
function isModuleInstalled(nodeModulesPath, moduleName) {
    const segments = moduleName.split("/");
    const modulePath = path.join(nodeModulesPath, ...segments);
    return fs.existsSync(modulePath);
}
//# sourceMappingURL=nodeDeps.js.map