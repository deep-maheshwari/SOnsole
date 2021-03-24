import * as vscode from 'vscode';
// const fs = require("fs");
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

let folderPath = "";

if (vscode.workspace.workspaceFolders) {
	folderPath = vscode.workspace.workspaceFolders[0].uri
		.toString()
		.split(":")[1];
	console.log(folderPath);
}

const data = "hello world";

fs.writeFile(path.join( < string > folderPath, "output.txt"), "", err => {
	if (err) {
		return vscode.window.showErrorMessage(
			"Failed to create boilerplate file!"
		);
	}
	vscode.window.showInformationMessage("Created boilerplate files");
});
// Common data to be used elsewhere

let terminalData = {};

export function activate(context: vscode.ExtensionContext) {
	let options = vscode.workspace.getConfiguration('terminalCapture');
	terminalData = {};

	if (options.get('enable') === false) {
		console.log('Terminal Capture is disabled');
		return;
	}

	console.log('sonsole extension is now active');

	if (options.get('useClipboard') === false) {
		vscode.window.terminals.forEach(t => {
			registerTerminalForCapture(t);
		});

		vscode.window.onDidOpenTerminal(t => {
			registerTerminalForCapture(t);
		});
	}

	context.subscriptions.push(vscode.commands.registerCommand('extension.sonsole.runCapture', async () => {
		if (options.get('enable') === false) {
			console.log('Command has been disabled, not running');
		}

		const terminals = < vscode.Terminal[] > ( < any > vscode.window).terminals;
		if (terminals.length <= 0) {
			vscode.window.showWarningMessage('No terminals found, cannot run copy');
			return;
		}


		await runClipboardMode();
		await cleancache();

	}));
}

export function deactivate() {
	console.log(terminalData);
	terminalData = {};
}

async function runClipboardMode() {

	await vscode.commands.executeCommand('workbench.action.terminal.selectAll');

	await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
	await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');
	let url = vscode.Uri.parse('file:' + folderPath + "/output.txt");

	await vscode.commands.executeCommand('vscode.open', url);

	await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	await vscode.commands.executeCommand('workbench.action.terminal.clear');

	let text="";
	vscode.workspace.openTextDocument(folderPath + "/output.txt").then(async (document) => {
		text = document.getText();
		//console.log(text);
		let errList:string[];
		console.log(text);
		
			errList = text.split('\n');
			errList = errList.filter((err) => { return err.length > 0; });
			errList.shift();
			errList.pop();
			
			errList = errList.filter((err) => { return err.toLowerCase().includes("error"); });
			
		
	
		console.log(errList);

		const panel = vscode.window.createWebviewPanel('sonsoleView', 'Answers', vscode.ViewColumn.Two, {
			enableScripts: true
		});
		panel.webview.html = await getWebviewContent(errList);
		
	});


	

}

async function getWebviewContent(errList:string[]) {


	let htmlResponse = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
	</head>	
	<body>
		<h1>Results from stack overflow will be shown here</h1>
		<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
		<h1 id="lines-of-code-counter">0</h1>
		<script>
			const counter = document.getElementById('lines-of-code-counter');

			let count = 0;
			setInterval(() => {
				counter.textContent = count++;
			}, 100);
		</script>
	</body>
	
	</html>`;


	let response: any;
	response = await axios.get(`https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=activity&body=${errList[0]}&site=stackoverflow`);
	let data = response.data;
	var pre = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
		
		<title>Cat Coding</title>
	</head>	
	<body>
		<h1>Results from stack overflow will be shown here</h1>`
	var list = `<ul class="list-group">`;
	for(let i = 0; i < data.items.length; i+=1){
		var list_item = `<li class="list-group-item">
		<p><a href=${data.items[i].link}>${data.items[i].title}</a></p>
		<p><ul>
		`
		for(let j =0; j< data.items[i].tags.length; j++){
			list_item += `<li>${data.items[i].tags[j]}</li>`
		}
		list_item += "</ul></p>"
		list += list_item
	}
	list += `<ul>`;
	var post = `</body></html>`;
	var doc = pre + list + post;
	return doc;
}

function cleancache() {
	fs.writeFile(path.join( < string > folderPath, "output.txt"), "", err => {
		if (err) {
			return vscode.window.showErrorMessage(
				"Failed to create boilerplate file!"
			);
		}
		vscode.window.showInformationMessage("Created boilerplate files");
	});
	vscode.commands.executeCommand('workbench.action.files.saveAll');

}

async function deleteFile(filePath: fs.PathLike) {
	try {
		fs.unlink(filePath, () => {
			console.log(`Deleted ${filePath}`);
		});

	} catch (error) {
		console.error(`Got an error trying to delete the file: ${error.message}`);
	}
}

function registerTerminalForCapture(terminal: vscode.Terminal) {
	terminal.processId.then(terminalId => {

		if (terminalId !== undefined) {

			( < any > terminalData)[terminalId] = "";
			( < any > terminal).onDidWriteData((data: any) => {
				// TODO:
				//   - Need to remove (or handle) backspace
				//   - not sure what to do about carriage return???
				//   - might have some odd output
				( < any > terminalData)[terminalId] += data;
			});
		}
	});
}

// const editor = vscode.window.activeTextEditor;

// 						if(editor!==undefined){

// 							var selection = editor.selection; 
// 							var text = editor.document.getText(selection);
// 							console.log(editor.document.getText());
// 						}
// 						vscode.workspace.openTextDocument('/home/kirtikjangale/Desktop/Project/sonsole/output.txt').then((document) => {
// 							let text = document.getText();
// 							console.log(text);
// 						});