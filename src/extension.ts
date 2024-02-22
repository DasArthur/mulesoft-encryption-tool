import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';


export function activate(context: vscode.ExtensionContext) {


    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async document => {
        if (document.languageId === 'yaml') {           
            // Store parameters in workspace state
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
        if (document.languageId === 'yaml') {
            // Retrieve and apply parameters when the YAML file is closed
            context.workspaceState.update(getStateKey(document), undefined);
        }
    }));


        let disposable = vscode.commands.registerCommand('mule-encryption-tool.encryptDecrypt', async () => {
        
        const jarPath = path.join(context.extensionPath, 'secure-properties-tool.jar');

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const documentName: string = activeEditor.document.fileName.toString();

        const selection = activeEditor.selection;
        const text = activeEditor.document.getText(selection);
        const matches = text.match(/!\[(.*?)\]/);
        const value = matches ? matches[1] : text;

        if (!value) {
            vscode.window.showErrorMessage("No text selected.");
            return;
        }

        // Collect user input
        // const method = await vscode.window.showInputBox({ prompt: 'Enter method (string/file/file-level)' });
        const operation = await vscode.window.showQuickPick(['encrypt', 'decrypt'],{ placeHolder: 'Enter operation (encrypt/decrypt)' });

        if (!operation) {
            // User pressed ESC, end the action
            return;
        }


        let params: { operation?: string; algorithm?: string; mode?: string; key?: string; useRandomIV?: string; } = context.workspaceState.get(getStateKey(activeEditor.document)) || {};

        let previous;
        if(params.algorithm != null){
            previous = await vscode.window.showQuickPick(['Yes', 'No'],{ placeHolder: 'Use previous value?' });
        }
        
        if(previous == "No" || params.algorithm == null){
            const algorithm = await vscode.window.showQuickPick(['AES', 'Blowfish', 'DES', 'DESede', 'RC2', 'RCA'],{ placeHolder: 'Enter algorithm (e.g., AES)' });
            if (!algorithm) {
                // User pressed ESC, end the action
                return;
            }
            const mode = await vscode.window.showQuickPick(["CBC", "CFB", "ECB", "OFB"],{ placeHolder: 'Enter mode (e.g., CBC)' });
            if (!mode) {
                // User pressed ESC, end the action
                return;
            }        
            const key = await vscode.window.showInputBox({ prompt: 'Enter Encryption Key' });
            if (key === undefined) {
                // User pressed ESC, end the action
                return;
            }
            const useRandomIV = await vscode.window.showQuickPick(['No', 'Yes'], { placeHolder: 'Use random IV?' });
            if (!useRandomIV) {
                // User pressed ESC, end the action
                return;
            }

            params = {
                operation,
                algorithm,
                mode,
                key,
                useRandomIV
            }
            context.workspaceState.update(getStateKey(activeEditor.document), params);
        }
        
        const showOutput = await vscode.window.showQuickPick(['Yes', 'No'],{ placeHolder: 'Just show the value. Dont edit actual file' });

        

       


        // Construct the command
        let command = `java -cp "${jarPath}" "com.mulesoft.tools.SecurePropertiesTool" "string" "${operation}" "${params.algorithm}" "${params.mode}" "${params.key}" "${value}"`;
        if (params.useRandomIV === 'Yes') {
            command += ' --use-random-iv';
        }

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showInformationMessage(`Error: ${stderr}`);
                console.error(`exec error: ${error}`);
                return;
            }
            const output = stdout.trim();
            vscode.window.showInformationMessage(`Output: ${stdout}`);
            // Replace the selected text with the output, wrapped in ![...]
            if(showOutput === 'No') {
                if (activeEditor) {
                    activeEditor.edit(editBuilder => {
                        if(operation == "encrypt"){
                            editBuilder.replace(selection, `![${output}]`);
                        }else{
                            editBuilder.replace(selection, `${output}`);
                        }
                    }).then(success => {
                        if (!success) {
                            vscode.window.showErrorMessage("Failed to replace text.");
                        }
                    });
                }
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}


function getStateKey(document: vscode.TextDocument): string {
    // Use the document's URI as a unique key
    return `params:${document.uri.path.toString()}`;
}


export function deactivate() {}
