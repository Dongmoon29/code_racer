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
import { vim } from '@replit/codemirror-vim';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  theme?: string;
  readOnly?: boolean;
  vimMode?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  theme = 'dark',
  readOnly = false,
  vimMode = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialValueRef = useRef(value);

  // Function to create all extensions
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
    ];

    // Add Vim extension only when Vim mode is enabled and not read-only
    if (vimMode && !readOnly) {
      extensions.push(
        vim({
          status: false, // Disable default status bar (we implement custom one)
        })
      );
    } else {
      // Add autocompletion only in normal mode
      extensions.push(
        autocompletion({
          defaultKeymap: true,
          activateOnTyping: true,
          maxRenderedOptions: 10,
        }),
        keymap.of([...completionKeymap])
      );
    }

    if (!readOnly) {
      // Add default keymaps only when Vim mode is disabled
      if (!vimMode) {
        extensions.push(keymap.of([indentWithTab, ...defaultKeymap]));
      } else {
        // In Vim mode, only add Tab key (Vim handles other keymaps)
        extensions.push(keymap.of([indentWithTab]));
      }
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

  // Update all extensions when Vim mode or theme changes
  useEffect(() => {
    if (!viewRef.current) return;

    const extensions = createExtensions(theme);
    viewRef.current.dispatch({
      effects: StateEffect.reconfigure.of(extensions),
    });
  }, [theme, language, readOnly, onChange, value, vimMode]);

  // Initial editor setup
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
  }, [language, readOnly]); // Remove theme dependency

  // Update only when value changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      const currentCursor = view.state.selection.main;
      const newDocLength = value.length;

      // Adjust cursor position to not exceed new document length
      const newAnchor = Math.min(currentCursor.anchor, newDocLength);
      const newHead = Math.min(currentCursor.head, newDocLength);

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
        selection: {
          anchor: newAnchor,
          head: newHead,
        },
      });
    }
  }, [value]);

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={editorRef} className="flex-1 overflow-auto relative" />
    </div>
  );
};

export default CodeEditor;
