import * as vscode from 'vscode';
import { loginCommand, disposeLogin } from './login_command';
import { checkCommand, focus_spy, focus_spy2} from './check_command';

export function activate(context: vscode.ExtensionContext) 
{
    // commands
    let disposable = vscode.commands.registerCommand('b1.login', loginCommand );
    context.subscriptions.push(disposable); 
	disposable = vscode.commands.registerCommand('b1.check', checkCommand);
	context.subscriptions.push(disposable);
    
    // event handlers
    disposable = vscode.window.onDidChangeWindowState(focus_spy);
    context.subscriptions.push(disposable);

    disposable = vscode.window.tabGroups.onDidChangeTabGroups(focus_spy2);
    context.subscriptions.push(disposable);
}

export function deactivate() {
    disposeLogin();
}

