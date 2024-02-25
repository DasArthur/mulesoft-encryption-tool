import * as vscode from 'vscode';
import { getStateKey } from './decryptEncryptFunction';


export async function setEncKey(context: vscode.ExtensionContext){
    let params: { key: string } = {"key": ""}
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage("No active editor found.");
        return false;
    }
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