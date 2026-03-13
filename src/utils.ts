
// Символы комментария в условии задачи и регулярное выражение для выделения решения
// зависят от языка задачи
//
interface LangSuit {
	open: string; 
	close: string;
	begin: string; 
	end: string
	cond: RegExp;
	brackets: RegExp;
}

export function lang_suit(lang: string): LangSuit {
	const dict: Record<string, LangSuit> = {
		csharp: {
			open: '/*',
			close: '*/',
			begin: "//BEGIN",
			end: "//END",
			cond: /\/\*[\s\S]*?\*\//g,
			brackets: /(\/\/BEGIN)([\s\S]*?)(\/\/END)/g,
		},
		python: {
			open: '"""',
			close: '"""',
			begin: "#BEGIN",
			end: "#END",
			cond: /"""[\s\S]*?"""/g,
			brackets: /(#BEGIN)([\s\S]*?)(#END)/g,
		},
		javascript: {
			open: '/*',
			close: '*/',
			begin: "//BEGIN",
			end: "//END",
			cond: /\/\*[\s\S]*?\*\//g,
			brackets: /(\/\/BEGIN)([\s\S]*?)(\/\/END)/g,
		},
		haskell: {
			open: '{-',
			close: '-}',
			begin: "--BEGIN",
			end: "--END",
			cond: /\{-[\s\S]*?-\}/g,
			brackets: /(\--BEGIN)([\s\S]*?)(\--END)/g,
		},
	};

	// Return a fallback so that callers don't crash on unsupported languages.
	return dict[lang] ?? dict.python;
}
