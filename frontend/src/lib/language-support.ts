import { CompletionContext } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import { LanguageSupport } from "@codemirror/language";

// Autocomplete suggestions for each language
const pythonCompletions = [
  { label: "def", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "if", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "print", type: "function" },
  { label: "return", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "from", type: "keyword" },
  { label: "as", type: "keyword" },
  { label: "True", type: "constant" },
  { label: "False", type: "constant" },
  { label: "None", type: "constant" },
];

const javascriptCompletions = [
  { label: "function", type: "keyword" },
  { label: "const", type: "keyword" },
  { label: "let", type: "keyword" },
  { label: "var", type: "keyword" },
  { label: "console.log", type: "function" },
  { label: "return", type: "keyword" },
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "true", type: "constant" },
  { label: "false", type: "constant" },
  { label: "null", type: "constant" },
  { label: "undefined", type: "constant" },
];

const goCompletions = [
  { label: "func", type: "keyword" },
  { label: "var", type: "keyword" },
  { label: "const", type: "keyword" },
  { label: "return", type: "keyword" },
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "range", type: "keyword" },
  { label: "package", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "fmt.Println", type: "function" },
];

// Language-specific autocomplete function
function createCompletions(completions: unknown[]) {
  return (context: CompletionContext) => {
    const before = context.matchBefore(/\w+/);
    if (!before || before.from == before.to) return null;
    return {
      from: before.from,
      options: completions,
    };
  };
}

const languageSupportCache = new Map<string, LanguageSupport>();

const createLanguageSupport = (language: string): LanguageSupport => {
  switch (language) {
    case "python": {
      const support = python();
      return new LanguageSupport(support.language, [
        support.support,
        support.language.data.of({
          autocomplete: createCompletions(pythonCompletions),
        }),
      ]);
    }
    case "go": {
      const support = go();
      return new LanguageSupport(support.language, [
        support.support,
        support.language.data.of({
          autocomplete: createCompletions(goCompletions),
        }),
      ]);
    }
    case "javascript":
    default: {
      const support = javascript();
      return new LanguageSupport(support.language, [
        support.support,
        support.language.data.of({
          autocomplete: createCompletions(javascriptCompletions),
        }),
      ]);
    }
  }
};

export const getLanguageSupport = (language: string): LanguageSupport => {
  const normalizedLanguage = ["python", "javascript", "go"].includes(language)
    ? language
    : "javascript";
  const cached = languageSupportCache.get(normalizedLanguage);
  if (cached) return cached;

  const support = createLanguageSupport(normalizedLanguage);
  languageSupportCache.set(normalizedLanguage, support);
  return support;
};
