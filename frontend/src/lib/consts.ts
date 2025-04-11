const LanguageID = {
  Python: 71, // Python 3
  JavaScript: 63, // JavaScript (Node.js)
  Java: 62, // Java
  CPP: 54, // C++
  Go: 60, // Go
} as const;

export type LanguageIDType = (typeof LanguageID)[keyof typeof LanguageID];
export default LanguageID;
