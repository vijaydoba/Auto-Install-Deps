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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const nodeDeps_1 = require("./nodeDeps");
const pythonDeps_1 = require("./pythonDeps");
const javaDeps_1 = require("./javaDeps");
const csharpDeps_1 = require("./csharpDeps");
const phpDeps_1 = require("./phpDeps");
const goDeps_1 = require("./goDeps");
const rustDeps_1 = require("./rustDeps");
const rubyDeps_1 = require("./rubyDeps");
const dartDeps_1 = require("./dartDeps");
const DOCUMENT_SELECTOR = { scheme: "file" };
let diagnosticCollection;
function activate(context) {
    diagnosticCollection =
        vscode.languages.createDiagnosticCollection("missingDeps");
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
        updateDiagnostics(doc);
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        updateDiagnostics(e.document);
    }));
    vscode.workspace.textDocuments.forEach((doc) => {
        updateDiagnostics(doc);
    });
    const installCommand = vscode.commands.registerCommand("auto-install-deps.installDependency", async (dependencyName, workspaceFolderFsPath, language = "node") => {
        if (!dependencyName || !workspaceFolderFsPath) {
            vscode.window.showErrorMessage("Missing dependency name or workspace path.");
            return;
        }
        let installCmd;
        const terminalName = `Auto Install Deps: ${dependencyName}`;
        switch (language) {
            case "python":
                installCmd = `pip install ${dependencyName}`;
                break;
            case "java":
                installCmd = `mvn dependency:get -Dartifact=${dependencyName}`;
                break;
            case "csharp":
                installCmd = `dotnet add package ${dependencyName}`;
                break;
            case "php":
                installCmd = `composer require ${dependencyName}`;
                break;
            case "go":
                installCmd = `go get ${dependencyName}`;
                break;
            case "rust":
                installCmd = `cargo add ${dependencyName}`;
                break;
            case "ruby":
                installCmd = `bundle add ${dependencyName}`;
                break;
            case "dart":
                installCmd = `dart pub add ${dependencyName}`;
                break;
            default: {
                const pkgManager = detectPackageManager(workspaceFolderFsPath);
                if (pkgManager === "yarn") {
                    installCmd = `yarn add ${dependencyName}`;
                }
                else if (pkgManager === "pnpm") {
                    installCmd = `pnpm add ${dependencyName}`;
                }
                else {
                    installCmd = `npm install ${dependencyName}`;
                }
                break;
            }
        }
        const terminal = vscode.window.createTerminal({
            name: terminalName,
            cwd: workspaceFolderFsPath,
        });
        terminal.show();
        terminal.sendText(installCmd);
    });
    context.subscriptions.push(installCommand);
    const codeActionProvider = new MissingDepsCodeActionProvider();
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(DOCUMENT_SELECTOR, codeActionProvider, {
        providedCodeActionKinds: MissingDepsCodeActionProvider.providedCodeActionKinds,
    }));
}
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
function updateDiagnostics(document) {
    const diagnostics = [];
    const wsFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!wsFolder) {
        diagnosticCollection.set(document.uri, diagnostics);
        return;
    }
    const workspacePath = wsFolder.uri.fsPath;
    const langId = document.languageId.toLowerCase();
    if (langId === "javascript" ||
        langId === "javascriptreact" ||
        langId === "typescript" ||
        langId === "typescriptreact") {
        diagnostics.push(...(0, nodeDeps_1.collectNodeDiagnostics)(document, workspacePath));
    }
    else if (langId === "python") {
        diagnostics.push(...(0, pythonDeps_1.collectPythonDiagnostics)(document, workspacePath));
    }
    else if (langId === "java") {
        diagnostics.push(...(0, javaDeps_1.collectJavaDiagnostics)(document, workspacePath));
    }
    else if (langId === "csharp") {
        diagnostics.push(...(0, csharpDeps_1.collectCsharpDiagnostics)(document, workspacePath));
    }
    else if (langId === "php") {
        diagnostics.push(...(0, phpDeps_1.collectPhpDiagnostics)(document, workspacePath));
    }
    else if (langId === "go") {
        diagnostics.push(...(0, goDeps_1.collectGoDiagnostics)(document, workspacePath));
    }
    else if (langId === "rust") {
        diagnostics.push(...(0, rustDeps_1.collectRustDiagnostics)(document, workspacePath));
    }
    else if (langId === "ruby") {
        diagnostics.push(...(0, rubyDeps_1.collectRubyDiagnostics)(document, workspacePath));
    }
    else if (langId === "dart") {
        diagnostics.push(...(0, dartDeps_1.collectDartDiagnostics)(document, workspacePath));
    }
    diagnosticCollection.set(document.uri, diagnostics);
}
function detectPackageManager(workspaceFolderFsPath) {
    if (fs.existsSync(path.join(workspaceFolderFsPath, "yarn.lock"))) {
        return "yarn";
    }
    if (fs.existsSync(path.join(workspaceFolderFsPath, "pnpm-lock.yaml"))) {
        return "pnpm";
    }
    return "npm";
}
class MissingDepsCodeActionProvider {
    provideCodeActions(document, range, context, token) {
        const actions = [];
        for (const diagnostic of context.diagnostics) {
            const codeInfo = diagnostic.code;
            if (!codeInfo || codeInfo.value !== "missingDeps")
                continue;
            const moduleName = codeInfo.moduleName;
            const workspacePath = codeInfo.workspacePath;
            const language = codeInfo.language || "node";
            const title = `Install dependency "${moduleName}"`;
            const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
            action.diagnostics = [diagnostic];
            action.isPreferred = true;
            action.command = {
                command: "auto-install-deps.installDependency",
                title,
                arguments: [moduleName, workspacePath, language],
            };
            actions.push(action);
        }
        return actions;
    }
}
MissingDepsCodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
];
//# sourceMappingURL=extension.js.map