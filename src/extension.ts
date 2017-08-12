import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('mrng.scaffold', (uri?: vscode.Uri) => {
		if (!uri) {
			return;
		}

		vscode.window.showInputBox({
			prompt: 'Folder name',
		}).then(value => {
			if (!value) {
				return;
			}

			const folder = path.join(uri.fsPath, value);
			fs.mkdirSync(folder);

			const f1 = path.join(folder, `${value}.component.ts`);
			const f2 = path.join(folder, `${value}.html`);
			const f3 = path.join(folder, `${value}.scss`);
			const files = [f1, f2, f3];

			for (const file of files) {
				fs.appendFileSync(file, '');
			}

			return vscode.workspace.openTextDocument(f1)
				.then((textDocument) => {
					if (textDocument) {
						vscode.window.showTextDocument(textDocument);
					}
				});
		});
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {
}
