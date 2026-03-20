import * as vscode from 'vscode';
import { langSuit, restTime } from './utils';
import * as login from './login_command';

const config = vscode.workspace.getConfiguration("b1");
const HOST_1 = config.get<string>("host_1");  



// CHECK - send to the server solving and track
//
export async function checkCommand() {

    if (!login.problem || !login.accessToken || !login.editor || !login.trace) {
        vscode.window.showErrorMessage("Do LOGIN first.");
        return;
    }
    const data = {
        problem_id: login.problem.id,
        solving: getUserSolving(login.editor, login.problem),
        trace: login.trace.toJson()
    }
    let response;
    try {
        response = await fetch(`${HOST_1}/check/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie: `access_token=${login.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            vscode.window.showErrorMessage(`Checking failed. HOST_1 response status ${response.status}`);
        }
    // Unknown error
	} catch (err: any) {
		vscode.window.showErrorMessage(err?.code ?? err?.message ?? String(err));
	}        

    // відкидає накопичену трасу 
    login.trace.diffs = [[0, login.trace.lastText, 0]];

    // показує час
    vscode.window.showInformationMessage(`Rest time = ${restTime()}`);

    // показує результат віддаленої перевірки рішення 
    const check_answer: any = await response!.json();
    if (check_answer.startsWith("OK")) {
        vscode.window.showInformationMessage(JSON.stringify(check_answer));
    } else {
        vscode.window.showErrorMessage(JSON.stringify(check_answer));
    }
}


// Якщо є викладацькі дужки, повертається їхній вміст.
// Якщо їх немає, повертається все, крім умови завдання у першому багаторядковому коменті.
//
export function getUserSolving(editor: vscode.TextEditor, problem: login.Problem)
{
	let {cond, brackets} = langSuit(problem.lang);
	let screen = editor.document.getText();	
    
	let match = brackets.exec(screen);
	if (match) {
	    return match[2];
	}
	// remove a problem condition
	screen = screen.replace(cond, "");
	return screen;
}

// ------------------- focuse spies ---------------------------------

let fcounter = 0;
let tcounter = 0;

export function focus_spy(state: vscode.WindowState) 
{
    if (!state.focused) {
        fcounter += 1;
        login.trace?.addComment("FOCUS LOST " + fcounter )
    }
}

export function focus_spy2(e: vscode.TabGroupChangeEvent) 
{
    tcounter += 1;
    login.trace?.addComment("TAB CHANGED" + tcounter )
}
