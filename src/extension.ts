import * as vscode from 'vscode';
import fetch from 'node-fetch';

type Problem = { id: string, lang: string, cond: string, view: string };

let accessToken: string | undefined;
let problem: Problem | null = null;

export function activate(context: vscode.ExtensionContext) {

    const disposable1 = vscode.commands.registerCommand('pss.login', loginCommand );
    context.subscriptions.push(disposable1); // Make sure to dispose of the object when the extension is deactivated
	const disposable2 = vscode.commands.registerCommand('pss.check', checkCommand);
	context.subscriptions.push(disposable2);	
}

export function deactivate() {
    accessToken = undefined;
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


async function loginCommand() {

    // input
    const [username, password, pset_title] = await input();
    if (!username) return;   
    vscode.window.showInformationMessage("Ready to code.");

    accessToken = await getToken(username, password);

    problem = await getProblem(pset_title);
    if (!problem) {
        vscode.window.showErrorMessage("Init proc is not succesful. Problem = null")
        return;
    }

	// Show the problem in a new editor
	let {lang, open, close} = lang_suit(problem.lang);
	let content = open+"\n" + problem.cond + "\n" + close + "\n" + problem.view; 
    await saveAndOpenEditor(content);
}



async function input(): Promise<string[]> 
{
    return ["tutor", "qweszxcQWESZXC", "111"];
    // const username = await vscode.window.showInputBox({
    //     prompt: "Enter username"
    // });

    // if (!username) {
    //     vscode.window.showErrorMessage("Username is required");
    //     return ["", "", ""];
    // }

    // const password = await vscode.window.showInputBox({
    //     prompt: "Enter password",
    //     password: true
    // });

    // if (!password) {
    //     vscode.window.showErrorMessage("Password is required");
    //     return ["", "", ""];
    // }

    // const pset_title = await vscode.window.showInputBox({
    //     prompt: "Enter pset_title",
    //     password: true
    // });

    // if (!pset_title) {
    //     vscode.window.showErrorMessage("Worbook is required");
    //     return ["", "", ""];
    // }
    // return [username, password, pset_title];
}

function view(problem: Problem) {
    let code = "Error: unknown problem lang.";
    if (problem.lang == "py")
        code = `'''${problem.cond}\n'''\n#BEGIN\n${problem.view}\n#END\n`;
    else if (problem.lang == "cs" || problem.lang == "js")
        code = `/*${problem.cond}\n*/\n//BEGIN\n${problem.view}\n//END\n`;
    return code;
}

async function getToken(username: string, password: string) {
    try {
        const body = new URLSearchParams();
        body.append("username", username);
        body.append("password", password);

        // const response = await fetch("https://tss.co.ua:7073/token/", {
        const response = await fetch("http://127.0.0.1:7003/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: body.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const tokenResponse: any = await response.json();

        if (typeof tokenResponse === "string") {
            return tokenResponse;
        } else {
            throw new Error("Unexpected token response format");
        }
    }
    catch (err: any) {
        vscode.window.showErrorMessage("Login failed: " + err.message);
    }
} 

async function getProblem(pset_title: string): Promise<Problem | null> {

    if (!accessToken) {
        vscode.window.showErrorMessage("Not authenticated");
        return null;
    }
    try {

        // const response = await fetch(`https://tss.co.ua:7071/solving/vscode/${pset_title}`, {
        const response = await fetch(`http://127.0.0.1:7001/solving/vscode/${pset_title}`, {
            headers: {
                cookie: `access_token=${accessToken}`
                // Authorization: `Bearer ${}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const problem: Problem = <Problem> await response.json();
        return problem;

    } catch (err: any) {
        vscode.window.showErrorMessage("Open problem failed: " + err.message);
    }
    return null;

}

async function saveAndOpenEditor(content: string) {

    const folder = vscode.workspace.workspaceFolders?.[0];

    if (!folder) {
        vscode.window.showErrorMessage("Open any folder.");
        return;
    }
    const fileUri = vscode.Uri.joinPath(folder.uri, "prog.py");

    await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(content, "utf8")
    );

    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);
}

//#region utils


// Символы комментария в условии задачи и регулярное выражение для выделения решения
// зависят от языка задачи
//
interface LangSuit {
	lang: string;
	open: string;
	close: string;
	cond: RegExp;
	brackets: RegExp;
}

function lang_suit(lang: string): LangSuit {
	const dict: Record<string, LangSuit> = {
		csharp: {
			lang: 'csharp',
			open: '/*',
			close: '*/',
			cond: /\/\*[\s\S]*?\*\//g,
			brackets: /(\/\/BEGIN)([\s\S]*?)(\/\/END)/g,
		},
		python: {
			lang: 'python',
			open: '"""',
			close: '"""',
			cond: /"""[\s\S]*?"""/g,
			brackets: /(#BEGIN)([\s\S]*?)(#END)/g,
		},
		javascrip: {
			lang: 'javascript',
			open: '/*',
			close: '*/',
			cond: /\/\*[\s\S]*?\*\//g,
			brackets: /(\/\/BEGIN)([\s\S]*?)(\/\/END)/g,
		},
		haskell: {
			lang: 'haskell',
			open: '{-',
			close: '-}',
			cond: /\{-[\s\S]*?-\}/g,
			brackets: /(\--BEGIN)([\s\S]*?)(\--END)/g,
		},
	};

	// Return a fallback so that callers don't crash on unsupported languages.
	return dict[lang] ?? dict.py;
}

//#endregion utils
