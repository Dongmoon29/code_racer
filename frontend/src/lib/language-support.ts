import { CompletionContext } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { LanguageSupport } from '@codemirror/language';

// Autocomplete suggestions for each language
const pythonCompletions = [
  { label: 'def', type: 'keyword' },
  { label: 'class', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'print', type: 'function' },
  { label: 'return', type: 'keyword' },
  { label: 'import', type: 'keyword' },
  { label: 'from', type: 'keyword' },
  { label: 'as', type: 'keyword' },
  { label: 'True', type: 'constant' },
  { label: 'False', type: 'constant' },
  { label: 'None', type: 'constant' },
];

const javascriptCompletions = [
  { label: 'function', type: 'keyword' },
  { label: 'const', type: 'keyword' },
  { label: 'let', type: 'keyword' },
  { label: 'var', type: 'keyword' },
  { label: 'console.log', type: 'function' },
  { label: 'return', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'true', type: 'constant' },
  { label: 'false', type: 'constant' },
  { label: 'null', type: 'constant' },
  { label: 'undefined', type: 'constant' },
];

const goCompletions = [
  { label: 'func', type: 'keyword' },
  { label: 'var', type: 'keyword' },
  { label: 'const', type: 'keyword' },
  { label: 'return', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'range', type: 'keyword' },
  { label: 'package', type: 'keyword' },
  { label: 'import', type: 'keyword' },
  { label: 'fmt.Println', type: 'function' },
];

const rustCompletions = [
  { label: 'fn', type: 'keyword' },
  { label: 'let', type: 'keyword' },
  { label: 'mut', type: 'keyword' },
  { label: 'return', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'struct', type: 'keyword' },
  { label: 'impl', type: 'keyword' },
  { label: 'println!', type: 'macro' },
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

export const getLanguageSupport = (language: string): LanguageSupport => {
  switch (language) {
    case 'python':
      return new LanguageSupport(python().language, [
        python().support,
        python().language.data.of({
          autocomplete: createCompletions(pythonCompletions),
        }),
      ]);
    case 'javascript':
      return new LanguageSupport(javascript().language, [
        javascript().support,
        javascript().language.data.of({
          autocomplete: createCompletions(javascriptCompletions),
        }),
      ]);
    case 'go':
      return new LanguageSupport(go().language, [
        go().support,
        go().language.data.of({
          autocomplete: createCompletions(goCompletions),
        }),
      ]);
    case 'rust':
      return new LanguageSupport(rust().language, [
        rust().support,
        rust().language.data.of({
          autocomplete: createCompletions(rustCompletions),
        }),
      ]);
    default:
      return new LanguageSupport(javascript().language, [
        javascript().support,
        javascript().language.data.of({
          autocomplete: createCompletions(javascriptCompletions),
        }),
      ]);
  }
};
