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
      fontFamily: 'var(--font-mono)',
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

// VS Code Dark theme autocomplete styles
const vscodeDarkCompletionStyle = {
  '.cm-tooltip': {
    backgroundColor: '#252526',
    border: '1px solid #454545',
    borderRadius: '3px',
    padding: '0',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      maxHeight: '300px',
      maxWidth: '400px',
    },
    '& > ul > li': {
      padding: '4px 8px',
      lineHeight: '1.2',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#2C2C2D',
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

// VS Code Dark+ theme style definition
export const vscodeDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1E1E1E',
    color: '#D4D4D4',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#AEAFAD',
  },
  '.cm-cursor': {
    borderLeftColor: '#AEAFAD',
  },
  '.cm-activeLine': {
    backgroundColor: '#2C323C44',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2C323C44',
  },
  '.cm-gutters': {
    backgroundColor: '#1E1E1E',
    color: '#858585',
    border: 'none',
    borderRight: '1px solid #333',
  },
  '.cm-lineNumbers': {
    color: '#858585',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#3B514D',
    color: '#FFFFFF !important',
    outline: '1px solid #4E4E4E',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#3B514D',
  },
  '.cm-searchMatch': {
    backgroundColor: '#613214',
    outline: '1px solid #896B1B',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#896B1B',
  },
  ...vscodeDarkCompletionStyle,
});

// VS Code Dark+ syntax highlighting styles
export const vscodeDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#569CD6' },
  { tag: tags.operator, color: '#D4D4D4' },
  { tag: tags.special(tags.variableName), color: '#9CDCFE' },
  { tag: tags.typeName, color: '#4EC9B0' },
  { tag: tags.atom, color: '#569CD6' },
  { tag: tags.number, color: '#B5CEA8' },
  { tag: tags.definition(tags.variableName), color: '#9CDCFE' },
  { tag: tags.string, color: '#CE9178' },
  { tag: tags.special(tags.string), color: '#CE9178' },
  { tag: tags.comment, color: '#6A9955' },
  { tag: tags.variableName, color: '#9CDCFE' },
  { tag: tags.tagName, color: '#569CD6' },
  { tag: tags.attributeName, color: '#9CDCFE' },
  { tag: tags.propertyName, color: '#9CDCFE' },
  { tag: tags.className, color: '#4EC9B0' },
  { tag: tags.heading, color: '#569CD6' },
  { tag: tags.content, color: '#D4D4D4' },
  { tag: tags.meta, color: '#D4D4D4' },
  { tag: tags.link, color: '#569CD6' },
  { tag: tags.name, color: '#569CD6' },
]);
