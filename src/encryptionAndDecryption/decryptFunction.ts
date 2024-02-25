import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { getStateKey } from './decryptEncryptFunction';

export async function decrypt(value: string,context: vscode.ExtensionContext, encKey: string): Promise<boolean> {


    

    const jarPath = path.join(context.extensionPath, 'secure-properties-tool.jar');

    console.log("enc key",encKey);

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage("No active editor found.");
        return false;
    }

	let params: {  key: string }  = context.workspaceState.get(getStateKey(activeEditor.document )) || {key: ""};
		if(params.key == ""){
			console.log("keyyy",params.key)
			params.key = await vscode.window.showInputBox({ prompt: 'Enter Encryption Key' }) || "";
			if (params.key === undefined) {
				// User pressed ESC, end the action
                return false;
			}
            context.workspaceState.update(getStateKey(activeEditor.document), params);
		}

    // Collect user input
    const operation = "decrypt"

    const algorithm = vscode.workspace.getConfiguration('muleEncryptionTool').get<string>('defaultAlgorithm');
    const mode = vscode.workspace.getConfiguration('muleEncryptionTool').get<string>('defaultMode');
    const useRandomIV = vscode.workspace.getConfiguration('muleEncryptionTool').get<string>('defaultUseRandomIV');
    
    const success = await new Promise<boolean>((resolve) => {
        // Construct the command
        let command = `java -cp "${jarPath}" "com.mulesoft.tools.SecurePropertiesTool" "string" "${operation}" "${algorithm}" "${mode}" "${params.key}" "${value}"`;
        if (useRandomIV === "true") {
            command += ' --use-random-iv';
        }

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve(false);
                return false;
            }
            if (stderr) {
                resolve(false);
                return;
            }

            resolve(true);
            
        });
    });

    return success;


}