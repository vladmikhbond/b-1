import * as vscode from 'vscode';
import { lang_suit } from './utils';

import * as login from './login_command';

let fcounter = 0;

// CHECK - send solving and track
//
export async function checkCommand() {

    if (!login.problem) {
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
            "problem_id": login.problem.id, 
            "solving": getUserSolving(editor, login.problem),
            "trace": login.trace?.toJson()
        };

        // const response = await fetch("https://tss.co.ua:7071/check/", {
        const response = await fetch("http://127.0.0.1:7001/check/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie: `access_token=${login.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP: ${response.status}`);
        }
        
        // відкидає накопичену трасу 
        if (login.trace) {
            login.trace.diffs = [[0, login.trace.lastText, 0]];
        } else {
            vscode.window.showErrorMessage("Trace does not work.");
        }

        // відображує результат віддаленої перевірки рішення 
        const check_answer: any = await response.json();
        if (check_answer.startsWith("OK")) {
            vscode.window.showInformationMessage(JSON.stringify(check_answer));
        } else {
            vscode.window.showErrorMessage(JSON.stringify(check_answer));
        }
    
    // зовсім неочікувані помилки
	} catch (err: any) {
		vscode.window.showErrorMessage(err?.code ?? err?.message ?? String(err));
	}
}


// Якщо є викладацькі дужки, повертається їхній вміст.
// Якщо їх немає, повертається все, крім умови завдання у першому багаторядковому коменті.
//
function getUserSolving(editor: vscode.TextEditor, problem: login.Problem)
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
