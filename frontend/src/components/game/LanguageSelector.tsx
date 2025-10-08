import React, { memo, FC } from 'react';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'go', name: 'Go' },
] as const;

type SupportedLanguage = (typeof LANGUAGES)[number]['id'];

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
}

const LanguageSelector: FC<LanguageSelectorProps> = memo(
  ({ selectedLanguage, onChange, disabled = false }) => {
    return (
      <div className="flex items-center">
        <label htmlFor="language-select" className="mr-2 text-sm font-medium">
          Language:
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => onChange(e.target.value as SupportedLanguage)}
          disabled={disabled}
          className="px-2 py-1 cursor-pointer border rounded-md text-sm focus:outline-none disabled:opacity-50"
        >
          {LANGUAGES.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
