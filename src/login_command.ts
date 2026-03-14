import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { lang_suit } from './utils';

export let accessToken: string | undefined;

export type Problem = { id: string, lang: string, cond: string, view: string };
export let problem: Problem | undefined;

export async function loginCommand() {

    // input
    const [username, password, pset_title] = await input();
    if (!username) return;   

    accessToken = await getToken(username, password);

    const prob = await getProblem(pset_title);
    if (!prob) {
        vscode.window.showErrorMessage("Init proc is not succesful. Problem = null")
        return;
    }
	// Show the problem condition in a new editor
	let {open, close, begin, end} = lang_suit(prob.lang);
	let content = open +"\n" + prob.cond + "\n" + close + "\n" + begin + "\n" + prob.view + "\n" + end; 
    await saveAndOpenEditor(content);
    // Save prob as problem
    problem = prob;

    vscode.window.showInformationMessage("Ready to code.");
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
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const problemResponse: Problem  = <Problem> await response.json();
        return problemResponse;

    } catch (err: any) {
        vscode.window.showErrorMessage("Open problem failed: " + err.message);
    }
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

