import React, { memo } from 'react';

// 지원하는 언어 목록 (게임에서 사용하는 3종으로 제한)
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

const LanguageSelector: React.FC<LanguageSelectorProps> = memo(({
  selectedLanguage,
  onChange,
  disabled = false,
}) => {
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
        className="py-1 px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
      >
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
