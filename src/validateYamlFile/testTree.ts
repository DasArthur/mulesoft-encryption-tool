import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseYamlEncryption } from './parser';
import { encryptDecrypt } from '../encryptionAndDecryption/decryptEncryptFunction';
import { decrypt } from '../encryptionAndDecryption/decryptFunction';

const textDecoder = new TextDecoder('utf-8');

export type MarkdownTestData = TestFile | TestHeading | TestCase;

export const testData = new WeakMap<vscode.TestItem, MarkdownTestData>();

let generationCounter = 0;

export const getContentFromFilesystem = async (uri: vscode.Uri) => {
	try {
		const rawContent = await vscode.workspace.fs.readFile(uri);
		return textDecoder.decode(rawContent);
	} catch (e) {
		console.warn(`Error providing tests for ${uri.fsPath}`, e);
		return '';
	}
};

export class TestFile {
	public didResolve = false;

	public async updateFromDisk(controller: vscode.TestController, item: vscode.TestItem, context: vscode.ExtensionContext, encKey: string) {
		try {
			const content = await getContentFromFilesystem(item.uri!);
			item.error = undefined;
			this.updateFromContents(controller, content, item, context, encKey);
		} catch (e) {
			item.error = (e as Error).stack;
		}
	}

	/**
	 * Parses the tests from the input text, and updates the tests contained
	 * by this file to be those from the text,
	 */
	public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem, context: vscode.ExtensionContext, encKey: string) {
		const thisGeneration = generationCounter++;
		this.didResolve = true;

		
		parseYamlEncryption(content, {
			onTest: (range, value, empty, key) => {
				



				const data = new TestCase(value, encKey,thisGeneration, context, empty);
				const id = `${item.uri}/${range.start.line}`;

				let tcase = controller.items.get(id);

				if (empty) {
					if (tcase) {
						// If the test case exists and should be empty, delete it
						controller.items.delete(id);
					}
					// Since the test case is empty, we don't need to do anything else
					return;
				}


				if (!tcase) {
					tcase = controller.createTestItem(id, key, item.uri);
					testData.set(tcase, data);
					tcase.range = range;
					controller.items.add(tcase);
				}else{
					testData.set(tcase, data); // Update the associated data
					tcase.label = key; // Update the label
					tcase.range = range; // Update the range
				}
				
			},
			onHeading: (range) => {

				// PARENT STRUCTURE CURRENTLY DOES NOT WORK
			}
		});
		// ascend(0);


	}
}

export class TestHeading {
	constructor(public generation: number) { }
}


export class TestCase {
	constructor(
		private readonly line: string,
		private readonly enckey: string,
		public generation: number,
		private context: vscode.ExtensionContext ,
		private empty: boolean
	) { }

	getLabel() {
		return `${this.line}`;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const start = Date.now();
		await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
		const decrypted = await this.evaluate();
		const duration = Date.now() - start;

		if (decrypted) {
			options.passed(item, duration);
		} else {
			const message = new vscode.TestMessage(`Failure while decrypting ${this.line}`);
			message.location = new vscode.Location(item.uri!, item.range!);
			options.failed(item, message, duration);
		}
	}

	private evaluate() {
		if(this.empty){
			return true
		}else{
			return decrypt(this.line, this.context, this.enckey);
		}
	}
}

