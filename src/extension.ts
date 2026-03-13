import * as vscode from 'vscode';
import { loginCommand} from './login_command';
import { checkCommand} from './check_command';



export function activate(context: vscode.ExtensionContext) {

    const disposable1 = vscode.commands.registerCommand('pss.login', loginCommand );
    context.subscriptions.push(disposable1); // Make sure to dispose of the object when the extension is deactivated
	const disposable2 = vscode.commands.registerCommand('pss.check', checkCommand);
	context.subscriptions.push(disposable2);	
}

export function deactivate() {
    // accessToken = undefined;
}

