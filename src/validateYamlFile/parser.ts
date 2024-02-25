import * as vscode from 'vscode';

const testRe = /!\[(.*?)\]/;

const keyYaml = /(\w+):\s*"!\[(.*?)\]"/;

export const parseYamlEncryption = (text: string, events: {
	onTest(range: vscode.Range, value: string, empty: boolean, key: string): void;
	onHeading(range: vscode.Range): void;
}) => {
	const lines = text.split('\n');


	

	for (let lineNo = 0; lineNo < lines.length; lineNo++) {
		const line = lines[lineNo];
		const test = testRe.exec(line);
		const key = keyYaml.exec(line);

		if (lineNo == 0) {
			const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, line.length));
			events.onHeading(range);
		}

		if (test && test[1] && key) {
			const value = test[1];

			const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, test[0].length));
			events.onTest(range, value, false, key[1]);
		}else {
			const value = line;
			const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, line.length));
			events.onTest(range, "value", true, "empty");
		}

	

	}
};