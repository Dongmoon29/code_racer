// Example usage of SUPPORTED_LANGUAGES constants
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_DISPLAY_NAMES,
  LANGUAGE_EXTENSIONS,
  type SupportedLanguage,
} from '@/constants';

// ✅ Good: Using constants
const handleLanguageChange = (language: SupportedLanguage) => {
  switch (language) {
    case SUPPORTED_LANGUAGES.PYTHON:
      console.log('Python selected');
      break;
    case SUPPORTED_LANGUAGES.JAVASCRIPT:
      console.log('JavaScript selected');
      break;
    case SUPPORTED_LANGUAGES.GO:
      console.log('Go selected');
      break;
  }
};

// ✅ Good: Getting display name
const getLanguageDisplayName = (language: SupportedLanguage): string => {
  return LANGUAGE_DISPLAY_NAMES[language];
};

// ✅ Good: Getting file extension
const getFileExtension = (language: SupportedLanguage): string => {
  return LANGUAGE_EXTENSIONS[language];
};

// ✅ Good: Type-safe language array
const allLanguages: SupportedLanguage[] = [
  SUPPORTED_LANGUAGES.PYTHON,
  SUPPORTED_LANGUAGES.JAVASCRIPT,
  SUPPORTED_LANGUAGES.GO,
];

export {
  handleLanguageChange,
  getLanguageDisplayName,
  getFileExtension,
  allLanguages,
};
