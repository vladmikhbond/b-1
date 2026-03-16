import * as vscode from 'vscode';
import { loginCommand, disposeLogin } from './login_command';
import { checkCommand, focus_spy} from './check_command';
import { helpCommand} from './help_command';

export function activate(context: vscode.ExtensionContext) 
{
    let disposable = vscode.commands.registerCommand('b1.login', loginCommand );
    context.subscriptions.push(disposable); 
	disposable = vscode.commands.registerCommand('b1.check', checkCommand);
	context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('b1.help', () => helpCommand(context.extensionUri));
	context.subscriptions.push(disposable);
    
    disposable = vscode.window.onDidChangeWindowState(focus_spy);
    context.subscriptions.push(disposable);
}

export function deactivate() {
    disposeLogin();
}

