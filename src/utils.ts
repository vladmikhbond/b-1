
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

export function lang_suit(lang: string): LangSuit {
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
		javascript: {
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
	return dict[lang] ?? dict.python;
}
