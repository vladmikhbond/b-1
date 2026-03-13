import * as vscode from 'vscode';
import fetch from 'node-fetch';

let accessToken: string | undefined;

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('tss.login', async () => {
        // input
        const [username, password, pset_title] = await input();
        if (!username) return;   
        vscode.window.showInformationMessage("Ready to code.");

        accessToken = await getToken(username, password);

        const problem = await getProblem(pset_title);
        const doc = view(problem)
        await saveAndOpenEditor(doc);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    accessToken = undefined;
}

async function input() {
    return ["tutor", "qweszxcQWESZXC", "111"];
    const username = await vscode.window.showInputBox({
        prompt: "Enter username"
    });

    if (!username) {
        vscode.window.showErrorMessage("Username is required");
        return ["", "", ""];
    }

    const password = await vscode.window.showInputBox({
        prompt: "Enter password",
        password: true
    });

    if (!password) {
        vscode.window.showErrorMessage("Password is required");
        return ["", "", ""];
    }

    const pset_title = await vscode.window.showInputBox({
        prompt: "Enter pset_title",
        password: true
    });

    if (!pset_title) {
        vscode.window.showErrorMessage("Worbook is required");
        return ["", "", ""];
    }
    return [username, password, pset_title];
}

function view(problem: { lang: string; cond: string; view: string; }) {
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

async function getProblem(pset_title: string) {

    if (!accessToken) {
        vscode.window.showErrorMessage("Not authenticated");
        return;
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

        const problem: any = await response.json();
        return problem;

    } catch (err: any) {
        vscode.window.showErrorMessage("Open problem failed: " + err.message);
    }

}

async function saveAndOpenEditor(prog: string) {

    const folder = vscode.workspace.workspaceFolders?.[0];

    if (!folder) {
        vscode.window.showErrorMessage("Open any folder.");
        return;
    }
    const fileUri = vscode.Uri.joinPath(folder.uri, "prog.py");

    await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(prog, "utf8")
    );

    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);
}