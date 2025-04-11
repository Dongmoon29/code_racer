import React, { useRef, useEffect } from 'react';
import { EditorState, StateEffect } from '@codemirror/state';
import {
  EditorView,
  keymap,
  highlightActiveLine,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  vscodeDarkHighlightStyle,
  vscodeDarkTheme,
  vscodeLightHighlightStyle,
  vscodeLightTheme,
} from '../../lib/editor-theme';
import { getLanguageSupport } from '@/lib/language-support';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  theme?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  theme = 'dark',
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialValueRef = useRef(value);

  // 모든 확장 기능을 생성하는 함수
  const createExtensions = (theme: string) => {
    const languageSupport = getLanguageSupport(language);
    const themeStyle =
      theme === 'light'
        ? [vscodeLightTheme, syntaxHighlighting(vscodeLightHighlightStyle)]
        : [vscodeDarkTheme, syntaxHighlighting(vscodeDarkHighlightStyle)];

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      bracketMatching(),
      indentOnInput(),
      ...themeStyle,
      languageSupport,
      EditorState.readOnly.of(readOnly),
      autocompletion({
        defaultKeymap: true,
        activateOnTyping: true,
        maxRenderedOptions: 10,
      }),
      keymap.of([...completionKeymap]),
    ];

    if (!readOnly) {
      extensions.push(keymap.of([indentWithTab, ...defaultKeymap]));
    }

    if (onChange && !readOnly) {
      extensions.push(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            if (newValue !== value) {
              onChange(newValue);
            }
          }
        })
      );
    }

    return extensions;
  };

  // theme이 변경될 때마다 모든 확장 기능 업데이트
  useEffect(() => {
    if (!viewRef.current) return;

    const extensions = createExtensions(theme);
    viewRef.current.dispatch({
      effects: StateEffect.reconfigure.of(extensions),
    });
  }, [theme, language, readOnly, onChange, value]);

  // 초기 에디터 설정
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: createExtensions(theme),
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    const disableContextMenu = (e: MouseEvent) => {
      if (!readOnly) {
        e.preventDefault();
      }
    };

    editorRef.current.addEventListener('contextmenu', disableContextMenu);

    return () => {
      view.destroy();
      editorRef.current?.removeEventListener('contextmenu', disableContextMenu);
    };
  }, [language, readOnly]); // theme 의존성 제거

  // 외부에서 value가 변경될 때만 업데이트
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      const currentCursor = view.state.selection.main;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
        selection: { anchor: currentCursor.anchor, head: currentCursor.head },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="w-full h-full overflow-auto" />;
};

export default CodeEditor;
