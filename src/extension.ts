import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { loginCommand, Problem, problem } from './login_command';
import { lang_suit } from './utils';


export function activate(context: vscode.ExtensionContext) {

    const disposable1 = vscode.commands.registerCommand('pss.login', loginCommand );
    context.subscriptions.push(disposable1); // Make sure to dispose of the object when the extension is deactivated
	const disposable2 = vscode.commands.registerCommand('pss.check', checkCommand);
	context.subscriptions.push(disposable2);	
}

export function deactivate() {
    // accessToken = undefined;
}

// CHECK - send solving and log
//

async function checkCommand() {
    if (!problem) {
        vscode.window.showErrorMessage("Init proc is not succesful. Problem = null")
        return;
    }
	try {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No active editor");
			return;
		}
		let data = {
            "problem_id": problem.id, 
            "solving": getUserSolving(editor, problem),
            "trace": null
        };
        
        vscode.window.showInformationMessage(JSON.stringify(data))
        // let obj = await web2.check(model.ticketId, userSolving, log);
		// await afterWebCheckCommand(obj); 
	} catch (err: any) {
		vscode.window.showErrorMessage(err?.code ?? err?.message ?? String(err));
	}
}


// Якщо є викладацькі дужки, повертається їхній вміст.
// Якщо їх немає, повертається все, крім умови завдання у першому багаторядковому коменті.
//
function getUserSolving(editor: vscode.TextEditor, problem: Problem)
{
	let {cond, brackets} = lang_suit(problem.lang);
	let screen = editor.document.getText();	
    
	let match = brackets.exec(screen);
	if (match) {
	    return match[2];
	}
	// remove a problem condition
	screen = screen.replace(cond, "");
	return screen;
}




//#endregion utils
