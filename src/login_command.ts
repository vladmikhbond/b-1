import * as vscode from 'vscode';
import { langSuit, restTime } from './utils';
import { Trace } from './trace';
import { getUserSolving } from './check_command';

// params
const config = vscode.workspace.getConfiguration("b1");
const HOST_1 = config.get<string>("host_1");
const HOST_3 = config.get<string>("host_3");
const TRACE_INTERVAL = 3000;

let timer: NodeJS.Timeout | undefined;

export let accessToken: string;
export type Problem = { 
    id: string, 
    lang: string, 
    cond: string, 
    view: string,
    seconds: number
};
export let problem: Problem;
export let deadline: number;  // UTC date in msec
export let trace: Trace | undefined;
export let editor: vscode.TextEditor | undefined;

export async function loginCommand() 
{
    // get an accessToken
    const username = config.get<string>("username");
    const password = config.get<string>("password");
    if (!username || !password) {
        vscode.window.showErrorMessage("Set your username & password in B1 Settings.");
        return;
    }
    try {
        accessToken = await getToken(username, password);        
    } catch (err: any) {
        vscode.window.showErrorMessage("Login failed. " + (err?.message ?? String(err)));
        return;
    }

    // get a problem & deadline
    const probFullName = await vscode.window.showInputBox({
        prompt: "Enter full problem name"
    });
    if (!probFullName) {
        vscode.window.showErrorMessage("Full problem name required.");
        return;
    }
    try {
        problem = await getProblem(probFullName);        
    } catch (err: any) {
        vscode.window.showErrorMessage("Gettihg problem failed. " + (err?.message ?? String(err)));
        return;
    }
    deadline = Date.now() + problem.seconds * 1000;

    // open code editor
    try {
        editor = await saveAndOpenEditor(problem);       
    } catch (err: any) {
        vscode.window.showErrorMessage("Opening an editor failed. " + (err?.message ?? String(err)));
        return;
    }

    
    // start tracer
    trace = await initTracer();
    if (!trace) {
        vscode.window.showErrorMessage("No tracer.");
        return;
    }

    
    vscode.window.showInformationMessage(`Rest time = ${restTime()}`);
}


async function getToken(username: string, password: string): Promise<string> 
{
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const response = await fetch(`${HOST_3}/token/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
    });

    if (!response.ok) {
        throw new Error(`Cannot get the access token. Response status: ${response.status}. Check your username & password in B1 Settings`);
    }

    const tokenResponse: unknown = await response.json();
    if (typeof tokenResponse !== "string") {
        throw new Error("Unexpected token response format");    
    }

    return tokenResponse;
}

// probFullName = "pset_name.prob_name"
//
async function getProblem(probFullName: string): Promise<Problem>   
{
    const param = encodeURIComponent(probFullName);
    const url = `${HOST_1}/solving/vscode?fullname=${param}`;
        
    const response = await fetch(url, {
        headers: {
            cookie: `access_token=${accessToken!}`
        }
    });

    if (!response.ok) {
        throw new Error(`HOST_1 response status: ${response.status}. Param=${param}`);
    }

    const problemResponse: unknown = await response.json();
    if (!problemResponse || typeof problemResponse !== "object") {
        throw new Error("Invalid problem payload");
    }
    return problemResponse as Problem;
}

async function saveAndOpenEditor(problem: Problem) 
{
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        throw new Error("No opened folder. Open a folder.");
    }

    const { ext, open, close, begin, end } = langSuit(problem.lang);
    const text = `${open}\n${problem.cond}\n${close}\n${begin}\n${problem.view}\n${end}`;
    
    const fileUri = vscode.Uri.joinPath(folder.uri, `prog.${ext}`);

    await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(text, "utf8")
    );

    const doc = await vscode.workspace.openTextDocument(fileUri);
    return await vscode.window.showTextDocument(doc);
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


export function disposeLogin() {    
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }
}

