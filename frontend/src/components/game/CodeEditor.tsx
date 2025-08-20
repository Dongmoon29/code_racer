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
  // Vim 모드 상태 표시줄 스타일

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
    ];

    // Vim 모드가 활성화되어 있고 읽기 전용이 아닐 때만 Vim 확장 추가
    if (vimMode && !readOnly) {
      extensions.push(
        vim({
          status: false, // 기본 상태 표시줄 비활성화 (우리가 커스텀으로 구현)
        })
      );
    } else {
      // 일반 모드일 때만 자동 완성 추가
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
      // Vim 모드가 비활성화되어 있을 때만 기본 키맵 추가
      if (!vimMode) {
        extensions.push(keymap.of([indentWithTab, ...defaultKeymap]));
      } else {
        // Vim 모드에서는 Tab 키만 추가 (기본 키맵은 Vim이 처리)
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

  // Vim 모드나 theme이 변경될 때마다 모든 확장 기능 업데이트
  useEffect(() => {
    if (!viewRef.current) return;

    const extensions = createExtensions(theme);
    viewRef.current.dispatch({
      effects: StateEffect.reconfigure.of(extensions),
    });
  }, [theme, language, readOnly, onChange, value, vimMode]);

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
      const newDocLength = value.length;

      // 커서 위치가 새로운 문서 길이를 초과하지 않도록 조정
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
