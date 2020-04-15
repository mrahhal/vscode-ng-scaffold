import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { camel, constant, pascal } from 'case';

export function activate(context: vscode.ExtensionContext) {
	registerScaffold(context);
	registertransformDto(context);
}

function registerScaffold(context: vscode.ExtensionContext) {
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
			const f4 = path.join(folder, `${value}.ts`);
			const files = [f2, f3];

			for (const file of files) {
				fs.appendFileSync(file, '');
			}

			fs.appendFileSync(f1,
`import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
	selector: '${value}',
	templateUrl: './${value}.html',
	styleUrls: ['./${value}.scss'],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'class': '${value}',
	},
})
export class ${pascal(value)}Component implements OnInit {
	constructor() { }

	ngOnInit() { }
};
`);

			fs.appendFileSync(f4,
`import { ${pascal(value)}Component } from './${value}.component';

export const ${constant(value)}_DECLARATIONS: any[] = [
	${pascal(value)}Component,
];
`);

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

function registertransformDto(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('mrng.transformDto', (uri?: vscode.Uri) => {
		let documentPromise: Thenable<vscode.TextDocument>;
		if (!uri) {
			documentPromise = Promise.resolve(vscode.window.activeTextEditor.document);
		} else {
			documentPromise = vscode.workspace.openTextDocument(uri);
		}

		documentPromise.then(document => vscode.window.showTextDocument(document)).then(editor => {
			const document = editor.document;

			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(document.lineCount - 1);

			// Full range first
			let range = new vscode.Range(0,
				firstLine.range.start.character,
				document.lineCount - 1,
				lastLine.range.end.character);

			// If there's a selection..
			const selection = editor.selection;
			if (!selection.isEmpty) {
				range = new vscode.Range(selection.start, selection.end);
			}

			const text = document.getText(range);

			return editor.edit(textEdit => {
				textEdit.replace(
					range,
					transformFromCsharp(text));
			});
		});
	});

	context.subscriptions.push(disposable);
}

function transformFromCsharp(text: string): string {
	return text
		.replace(/public /g, '')
		.replace(/class/g, 'export interface')
		.replace(/Dto/g, '')
		.replace(/ { get; set; }/g, ';')
		.replace(/:/g, 'extends')
		.replace(/(.+) (.+);/g, (a, b, c) => {
			return camel(c) + ': ' + b + ';';
		})
		.replace(/\bint\b/g, 'number')
		.replace(/float/g, 'number')
		.replace(/double/g, 'number')
		.replace(/decimal/g, 'number')
		.replace(/List<(.+)>/g, '$1[]')
		.replace(/bool/g, 'boolean')
		.replace(/\?/g, ' | null')
		.replace(/DateTimeOffset/g, 'string')
		.replace(/DateTime/g, 'string');
}

export function deactivate() {
}
