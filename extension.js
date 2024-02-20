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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
function activate(context) {
    let disposable = vscode.commands.registerCommand('mulesoft-encryption-tool.encryptDecrypt', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        const selection = activeEditor.selection;
        const value = activeEditor.document.getText(selection);
        if (!value) {
            vscode.window.showErrorMessage("No text selected.");
            return;
        }
        // Collect user input
        // const method = await vscode.window.showInputBox({ prompt: 'Enter method (string/file/file-level)' });
        const operation = await vscode.window.showQuickPick(['encrypt', 'decrypt'], { placeHolder: 'Enter operation (encrypt/decrypt)' });
        const algorithm = await vscode.window.showQuickPick(['AES'], { placeHolder: 'Enter algorithm (e.g., AES)' });
        const mode = await vscode.window.showQuickPick(["CBC"], { placeHolder: 'Enter mode (e.g., CBC)' });
        const key = await vscode.window.showInputBox({ prompt: 'Enter key' });
        const useRandomIV = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Use random IV?' });
        // Construct the command
        let command = `java -cp secure-properties-tool.jar com.mulesoft.tools.SecurePropertiesTool 'string' ${operation} ${algorithm} ${mode} ${key} "${value}"`;
        if (useRandomIV === 'Yes') {
            command += ' --use-random-iv';
        }
        // Execute the command
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            vscode.window.showInformationMessage(`Output: ${stdout}`);
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map