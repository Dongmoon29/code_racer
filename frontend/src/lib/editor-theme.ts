import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// VS Code Light theme autocomplete styles
const vscodeLightCompletionStyle = {
  '.cm-tooltip': {
    backgroundColor: '#F3F3F3',
    border: '1px solid #E0E0E0',
    borderRadius: '3px',
    padding: '0',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: '13px',
      maxHeight: '300px',
      maxWidth: '400px',
    },
    '& > ul > li': {
      padding: '4px 8px',
      lineHeight: '1.2',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#E8E8E8',
      color: '#000000',
    },
  },
};

// GitHub Dark theme autocomplete styles
const vscodeDarkCompletionStyle = {
  '.cm-tooltip': {
    backgroundColor: '#161B22',
    border: '1px solid #30363D',
    borderRadius: '3px',
    padding: '0',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: '13px',
      maxHeight: '300px',
      maxWidth: '400px',
    },
    '& > ul > li': {
      padding: '4px 8px',
      lineHeight: '1.2',
      color: '#C9D1D9',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#1F6FEB33',
      color: '#FFFFFF',
    },
  },
};

// VS Code Light theme style definition
export const vscodeLightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#000000',
  },
  '.cm-cursor': {
    borderLeftColor: '#000000',
  },
  '.cm-activeLine': {
    backgroundColor: '#E5EBEE44',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#E5EBEE44',
  },
  '.cm-gutters': {
    backgroundColor: '#F3F3F3',
    color: '#237893',
    border: 'none',
    borderRight: '1px solid #E0E0E0',
  },
  '.cm-lineNumbers': {
    color: '#237893',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#C1E0F7',
    color: '#000000 !important',
    outline: '1px solid #B3D7EA',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#C1E0F7',
  },
  '.cm-searchMatch': {
    backgroundColor: '#FDFF98',
    outline: '1px solid #F7E9B0',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#F7E9B0',
  },
  ...vscodeLightCompletionStyle,
});

// VS Code Light syntax highlighting styles
export const vscodeLightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#0000FF' },
  { tag: tags.operator, color: '#000000' },
  { tag: tags.special(tags.variableName), color: '#001080' },
  { tag: tags.typeName, color: '#267F99' },
  { tag: tags.atom, color: '#0000FF' },
  { tag: tags.number, color: '#098658' },
  { tag: tags.definition(tags.variableName), color: '#001080' },
  { tag: tags.string, color: '#A31515' },
  { tag: tags.special(tags.string), color: '#A31515' },
  { tag: tags.comment, color: '#008000' },
  { tag: tags.variableName, color: '#001080' },
  { tag: tags.tagName, color: '#800000' },
  { tag: tags.attributeName, color: '#FF0000' },
  { tag: tags.propertyName, color: '#001080' },
  { tag: tags.className, color: '#267F99' },
  { tag: tags.heading, color: '#0000FF' },
  { tag: tags.content, color: '#000000' },
  { tag: tags.meta, color: '#000000' },
  { tag: tags.link, color: '#0000FF' },
  { tag: tags.name, color: '#0000FF' },
]);

// GitHub Dark theme style definition
export const vscodeDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0D1117',
    color: '#C9D1D9',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#C9D1D9',
  },
  '.cm-cursor': {
    borderLeftColor: '#C9D1D9',
  },
  '.cm-activeLine': {
    backgroundColor: '#161B2233',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#161B2233',
  },
  '.cm-gutters': {
    backgroundColor: '#0D1117',
    color: '#6E7681',
    border: 'none',
    borderRight: '1px solid #30363D',
  },
  '.cm-lineNumbers': {
    color: '#6E7681',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#163356',
    color: '#FFFFFF !important',
    outline: '1px solid #1F6FEB',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#163356',
  },
  '.cm-searchMatch': {
    backgroundColor: '#3E1F18',
    outline: '1px solid #8B949E',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#6E7681',
  },
  ...vscodeDarkCompletionStyle,
});

// GitHub Dark syntax highlighting styles
export const vscodeDarkHighlightStyle = HighlightStyle.define([
  // 키워드, 제어문 등
  { tag: tags.keyword, color: '#FF7B72' },
  { tag: tags.operator, color: '#C9D1D9' },

  // 변수 / 함수 / 특수 식별자
  { tag: tags.special(tags.variableName), color: '#D2A8FF' },
  { tag: tags.definition(tags.variableName), color: '#D2A8FF' },
  { tag: tags.variableName, color: '#C9D1D9' },

  // 타입 / 클래스
  { tag: tags.typeName, color: '#FFA657' },
  { tag: tags.className, color: '#4EC9B0' },

  // 리터럴
  { tag: tags.atom, color: '#79C0FF' },
  { tag: tags.number, color: '#79C0FF' },
  { tag: tags.string, color: '#A5D6FF' },
  { tag: tags.special(tags.string), color: '#A5D6FF' },

  // 주석
  { tag: tags.comment, color: '#8B949E' },

  // HTML / JSX
  { tag: tags.tagName, color: '#7EE787' },
  { tag: tags.attributeName, color: '#79C0FF' },
  { tag: tags.propertyName, color: '#79C0FF' },

  // 메타, 링크, 기타
  { tag: tags.heading, color: '#79C0FF' },
  { tag: tags.content, color: '#C9D1D9' },
  { tag: tags.meta, color: '#8B949E' },
  { tag: tags.link, color: '#79C0FF' },
  { tag: tags.name, color: '#C9D1D9' },
]);
