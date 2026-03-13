import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { lang_suit } from './utils';
import { problem, Problem, accessToken} from './login_command';

// CHECK - send solving and log
//
export async function checkCommand() {
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

        // const response = await fetch("https://tss.co.ua:7073/check/", {
        const response = await fetch("http://127.0.0.1:7003/check/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie: `access_token=${accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const check_answer: any = await response.json();

        vscode.window.showInformationMessage(JSON.stringify(check_answer))
         
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


