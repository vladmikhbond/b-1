import * as vscode from 'vscode';
import { lang_suit, restTime } from './utils';
import { Trace } from './trace';
import { getUserSolving } from './check_command';

const TRACE_INTERVAL = 3000;
let timer: NodeJS.Timeout | undefined;

export let accessToken: string | undefined;
export type Problem = { 
    id: string, 
    lang: string, 
    cond: string, 
    view: string,
    seconds: number
};
export let problem: Problem | undefined;
export let deadline: number;  // date in msec
export let trace: Trace | undefined;
export let editor: vscode.TextEditor | undefined;


export async function loginCommand() 
{
    const [username, password, pset_title] = await input();

    if (!username || !password || !pset_title) {
        vscode.window.showErrorMessage("Login canceled or incomplete input.");
        return;
    }

    accessToken = await getToken(username, password);
    if (!accessToken) {
         vscode.window.showErrorMessage("No access token.");
        return;
    }

    problem = await getProblem(pset_title);
    if (!problem) {
        vscode.window.showErrorMessage("Cannot to get a problem.");
        return;
    }
    deadline = Date.now() + problem.seconds * 1000;

    const { open, close, begin, end } = lang_suit(problem.lang);
    const view = `${open}\n${problem.cond}\n${close}\n${begin}\n${problem.view}\n${end}`;
    editor = await saveAndOpenEditor(view);
    if (!editor) {
        vscode.window.showErrorMessage("No code editor.");
        return;
    }
    
    trace = await initTracer();
    if (!trace) {
        vscode.window.showErrorMessage("No tracer.");
        return;
    }

    // 
    vscode.window.showInformationMessage(`Rest time = ${restTime()}`);
}


async function initTracer() {
    const trace = new Trace();
    trace.addText(getUserSolving(editor!, problem!));

    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(() => {
        trace!.addText(getUserSolving(editor!, problem!));
    }, TRACE_INTERVAL);
    return trace;
}



async function input()
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

async function getToken(username: string, password: string): Promise<string | undefined> {
    try {
        const body = new URLSearchParams();
        body.append("username", username);
        body.append("password", password);

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

        const tokenResponse: unknown = await response.json();
        if (typeof tokenResponse === "string") {
            return tokenResponse;
        }

        throw new Error("Unexpected token response format");
    } catch (err: any) {
        vscode.window.showErrorMessage("Login failed: " + (err?.message ?? String(err)));
        return;
    }
}

async function getProblem(pset_title: string) {
    if (!accessToken) {
        vscode.window.showErrorMessage("Not authenticated");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:7001/solving/vscode/${pset_title}`, {
            headers: {
                cookie: `access_token=${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const problemResponse: unknown = await response.json();
        if (!problemResponse || typeof problemResponse !== "object") {
            throw new Error("Invalid problem payload");
        }
        return problemResponse as Problem;
    } catch (err: any) {
        vscode.window.showErrorMessage("Open problem failed: " + (err?.message ?? String(err)));
        return;
    }
}

async function saveAndOpenEditor(text: string) {

    const folder = vscode.workspace.workspaceFolders?.[0];

    if (!folder) {
        vscode.window.showErrorMessage("No opened folder. Open a folder.");
        return;
    }
    const fileUri = vscode.Uri.joinPath(folder.uri, "prog.py");

    await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(text, "utf8")
    );

    const doc = await vscode.workspace.openTextDocument(fileUri);
    return await vscode.window.showTextDocument(doc);
}

export function disposeTrace() {
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }
}

