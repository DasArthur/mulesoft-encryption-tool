import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

export async function encryptDecrypt(context: vscode.ExtensionContext, operation: 'encrypt' | 'decrypt'): Promise<boolean> {
    const jarPath = path.join(context.extensionPath, 'secure-properties-tool.jar');

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage("No active editor found.");
        return false;
    }

    const selection = activeEditor.selection;
    const text = activeEditor.document.getText(selection);
    const matches = text.match(/!\[(.*?)\]/);
    const value = matches ? matches[1] : text;

    if (!value) {
        vscode.window.showErrorMessage("No text selected.");
        return false;
    }

    // Collect user input
    // const method = await vscode.window.showInputBox({ prompt: 'Enter method (string/file/file-level)' });


    let params: { key?: string } = context.workspaceState.get(getStateKey(activeEditor.document)) || {};


    const algorithm = vscode.workspace.getConfiguration('muleEncryptionTool').get<string>('defaultAlgorithm');
    const mode = vscode.workspace.getConfiguration('muleEncryptionTool').get<string>('defaultMode');
    const useRandomIV = vscode.workspace.getConfiguration('muleEncryptionTool').get<string>('defaultUseRandomIV');
    
    if(params.key == null){
           
        const key = await vscode.window.showInputBox({ prompt: 'Enter Encryption Key' });
        if (key === undefined) {
            // User pressed ESC, end the action
            return false;
        }

        params = {
            key
        }
        context.workspaceState.update(getStateKey(activeEditor.document), params);
    }
    
    const showOutput = await vscode.window.showQuickPick(['Yes', 'No'],{ placeHolder: 'Just show the value. Dont edit actual file' });

    const success = await new Promise<boolean>((resolve) => {
        // Construct the command
        let command = `java -cp "${jarPath}" "com.mulesoft.tools.SecurePropertiesTool" "string" "${operation}" "${algorithm}" "${mode}" "${params.key}" "${value}"`;
        if (useRandomIV === 'true') {
            command += ' --use-random-iv';
        }

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showInformationMessage(`Error: ${stderr}`);
                console.error(`exec error: ${error}`);
                resolve(false);
                return false;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                resolve(false);
                return;
            }

            const output = stdout.trim();
            vscode.window.showInformationMessage(`Output: ${stdout}`);
            resolve(true);
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
            
        });
    });

    return success;


}

export function getStateKey(document: vscode.TextDocument): string {
    // Use the document's URI as a unique key
    return `params:${document.uri.path.toString()}`;
}
