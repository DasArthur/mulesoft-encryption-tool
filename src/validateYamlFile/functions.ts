import * as vscode from 'vscode';
import { getContentFromFilesystem, TestCase, testData, TestFile } from './testTree';


function getOrCreateFile(controller: vscode.TestController, uri: vscode.Uri) {
	const existing = controller.items.get(uri.toString());
	if (existing) {
		return { file: existing, data: testData.get(existing) as TestFile };
	}

	const file = controller.createTestItem(uri.toString(), uri.path.split('/').pop()!, uri);
	controller.items.add(file);

	const data = new TestFile();
	testData.set(file, data);

	file.canResolveChildren = true;
	return { file, data };
}

function gatherTestItems(collection: vscode.TestItemCollection) {
	const items: vscode.TestItem[] = [];
	collection.forEach(item => items.push(item));
	return items;
}

function getWorkspaceTestPatterns() {
	if (!vscode.workspace.workspaceFolders) {
		return [];
	}

	return vscode.workspace.workspaceFolders.map(workspaceFolder => ({
		workspaceFolder,
		pattern: new vscode.RelativePattern(workspaceFolder, '**/*.md'),
	}));
}

async function findInitialFiles(controller: vscode.TestController, pattern: vscode.GlobPattern) {
	for (const file of await vscode.workspace.findFiles(pattern)) {
		getOrCreateFile(controller, file);
	}
}

function startWatchingWorkspace(controller: vscode.TestController, fileChangedEmitter: vscode.EventEmitter<vscode.Uri>, context: vscode.ExtensionContext, encKey: string) {
	return getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => {
		const watcher = vscode.workspace.createFileSystemWatcher(pattern);

		watcher.onDidCreate(uri => {
			getOrCreateFile(controller, uri);
			fileChangedEmitter.fire(uri);
		});
		watcher.onDidChange(async uri => {
			const { file, data } = getOrCreateFile(controller, uri);
			if (data.didResolve) {
				await data.updateFromDisk(controller, file, context, encKey);
			}
			fileChangedEmitter.fire(uri);
		});
		watcher.onDidDelete(uri => controller.items.delete(uri.toString()));

		findInitialFiles(controller, pattern);

		return watcher;
	});
}