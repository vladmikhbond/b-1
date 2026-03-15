import * as vscode from 'vscode';

export async function helpCommand(extensionUri: vscode.Uri) {
    try {
        const uri = vscode.Uri.joinPath(extensionUri, 'help.md');
        await vscode.commands.executeCommand(
            "markdown.showPreview",
            uri
        );
        // const doc = await vscode.workspace.openTextDocument(uri);
        // await vscode.window.showTextDocument(doc);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Unable to open help file: ${message}`);
    }
}

