import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { collectNodeDiagnostics } from "./nodeDeps";
import { collectPythonDiagnostics } from "./pythonDeps";
import { collectJavaDiagnostics } from "./javaDeps";
import { collectCsharpDiagnostics } from "./csharpDeps";
import { collectPhpDiagnostics } from "./phpDeps";
import { collectGoDiagnostics } from "./goDeps";
import { collectRustDiagnostics } from "./rustDeps";
import { collectRubyDiagnostics } from "./rubyDeps";
import { collectDartDiagnostics } from "./dartDeps";

const DOCUMENT_SELECTOR: vscode.DocumentSelector = { scheme: "file" };

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    diagnosticCollection =
        vscode.languages.createDiagnosticCollection("missingDeps");
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((doc) => {
            updateDiagnostics(doc);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            updateDiagnostics(e.document);
        }),
    );

    vscode.workspace.textDocuments.forEach((doc) => {
        updateDiagnostics(doc);
    });

    const installCommand = vscode.commands.registerCommand(
        "auto-install-deps.installDependency",
        async (
            dependencyName: string,
            workspaceFolderFsPath: string,
            language: string = "node",
        ) => {
            if (!dependencyName || !workspaceFolderFsPath) {
                vscode.window.showErrorMessage(
                    "Missing dependency name or workspace path.",
                );
                return;
            }

            let installCmd: string;
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
                    const pkgManager = detectPackageManager(
                        workspaceFolderFsPath,
                    );
                    if (pkgManager === "yarn") {
                        installCmd = `yarn add ${dependencyName}`;
                    } else if (pkgManager === "pnpm") {
                        installCmd = `pnpm add ${dependencyName}`;
                    } else {
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
        },
    );
    context.subscriptions.push(installCommand);

    const codeActionProvider = new MissingDepsCodeActionProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            DOCUMENT_SELECTOR,
            codeActionProvider,
            {
                providedCodeActionKinds:
                    MissingDepsCodeActionProvider.providedCodeActionKinds,
            },
        ),
    );
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}

function updateDiagnostics(document: vscode.TextDocument) {
    const diagnostics: vscode.Diagnostic[] = [];

    const wsFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!wsFolder) {
        diagnosticCollection.set(document.uri, diagnostics);
        return;
    }

    const workspacePath = wsFolder.uri.fsPath;
    const langId = document.languageId.toLowerCase();

    if (
        langId === "javascript" ||
        langId === "javascriptreact" ||
        langId === "typescript" ||
        langId === "typescriptreact"
    ) {
        diagnostics.push(...collectNodeDiagnostics(document, workspacePath));
    } else if (langId === "python") {
        diagnostics.push(...collectPythonDiagnostics(document, workspacePath));
    } else if (langId === "java") {
        diagnostics.push(...collectJavaDiagnostics(document, workspacePath));
    } else if (langId === "csharp") {
        diagnostics.push(...collectCsharpDiagnostics(document, workspacePath));
    } else if (langId === "php") {
        diagnostics.push(...collectPhpDiagnostics(document, workspacePath));
    } else if (langId === "go") {
        diagnostics.push(...collectGoDiagnostics(document, workspacePath));
    } else if (langId === "rust") {
        diagnostics.push(...collectRustDiagnostics(document, workspacePath));
    } else if (langId === "ruby") {
        diagnostics.push(...collectRubyDiagnostics(document, workspacePath));
    } else if (langId === "dart") {
        diagnostics.push(...collectDartDiagnostics(document, workspacePath));
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

function detectPackageManager(
    workspaceFolderFsPath: string,
): "npm" | "yarn" | "pnpm" {
    if (fs.existsSync(path.join(workspaceFolderFsPath, "yarn.lock"))) {
        return "yarn";
    }
    if (fs.existsSync(path.join(workspaceFolderFsPath, "pnpm-lock.yaml"))) {
        return "pnpm";
    }
    return "npm";
}

class MissingDepsCodeActionProvider
    implements vscode.CodeActionProvider<vscode.CodeAction>
{
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            const codeInfo = (diagnostic as any).code;
            if (!codeInfo || codeInfo.value !== "missingDeps") continue;

            const moduleName: string = codeInfo.moduleName;
            const workspacePath: string = codeInfo.workspacePath;
            const language: string = codeInfo.language || "node";

            const title = `Install dependency "${moduleName}"`;
            const action = new vscode.CodeAction(
                title,
                vscode.CodeActionKind.QuickFix,
            );
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
