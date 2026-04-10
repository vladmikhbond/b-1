import {deadline} from './login_command';
import * as vscode from 'vscode';

// Символи коментаря в умові та регулярний вираз для виділення рішення залежить від мови задачі
//
interface LangSuit {
	ext: string;
	open: string; 
	close: string;
	begin: string; 
	end: string
	cond: RegExp;
	brackets: RegExp;
}

export function langSuit(lang: string): LangSuit {
	const dict: Record<string, LangSuit> = {
		csharp: {
			ext: 'cs',
			open: '/*',
			close: '*/',
			begin: "//BEGIN",
			end: "//END",
			cond: /\/\*[\s\S]*?\*\//usg,
			brackets: /(\/\/BEGIN)([\s\S]*?)(\/\/END)/usg,
		},
		python: {
			ext: 'py',
			open: '"""',
			close: '"""',
			begin: "#BEGIN",
			end: "#END",
			cond: /"""[\s\S]*?"""/usg,
			brackets: /(#BEGIN)([\s\S]*?)(#END)/usg,
		},
		javascript: {
			ext: 'js',
			open: '/*',
			close: '*/',
			begin: "//BEGIN",
			end: "//END",
			cond: /\/\*[\s\S]*?\*\//usg,
			brackets: /(\/\/BEGIN)([\s\S]*?)(\/\/END)/usg,
		},
		haskell: {
			ext: 'hs',
			open: '{-',
			close: '-}',
			begin: "--BEGIN",
			end: "--END",
			cond: /\{-[\s\S]*?-\}/usg,
			brackets: /(--BEGIN)([\s\S]*?)(--END)/usg,
		},
	};

	// Return a fallback so that callers don't crash on unsupported languages.
	return dict[lang] ?? dict.python;
}

// rest time as string  (like 3'23")
//
export function restTime() {
	let totsec = (deadline - Date.now()) /1000 | 0;
	let sec = totsec % 60;
	let min = (totsec - sec) / 60;
	return `${min}' ${sec}"`;
}

