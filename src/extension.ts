import * as vscode from 'vscode';

import {  updateNodeForDocument } from './validateYamlFile/testRunner';
import { encryptDecrypt, getStateKey } from './encryptionAndDecryption/decryptEncryptFunction';
import { setEncKey } from './encryptionAndDecryption/setEncKey';


export function activate(context: vscode.ExtensionContext) {    

    
    updateNodeForDocument(context);

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
        if (document.languageId === 'yaml') {
            // Retrieve and apply parameters when the YAML file is closed
            context.workspaceState.update(getStateKey(document), undefined);
        }
    }));


    let disposable = vscode.commands.registerCommand('mule-encryption-tool.encrypt', async () => {
        encryptDecrypt(context, "encrypt");
    });    
    context.subscriptions.push(disposable);

    let disposable3 = vscode.commands.registerCommand('mule-encryption-tool.decrypt', async () => {
        encryptDecrypt(context, "decrypt");
    });    
    context.subscriptions.push(disposable3);

    let disposable2 = vscode.commands.registerCommand('mule-encryption-tool.configureUnittestArgs', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'Mule Encryption Tool Settings');
      });
    
    context.subscriptions.push(disposable2);

    let disposable4 = vscode.commands.registerCommand('mule-encryption-tool.setEncKey', () => {
        setEncKey(context);
    });

    
    
    context.subscriptions.push(disposable4);

}



export function deactivate() {}
