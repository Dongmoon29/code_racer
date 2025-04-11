import React from 'react';

// 지원하는 언어 목록
const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'rust', name: 'Rust' },
  { id: 'cpp', name: 'C++' },
  { id: 'go', name: 'Go' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onChange: (language: 'python' | 'javascript' | 'go') => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
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
        onChange={(e) => onChange(e.target.value as 'python' | 'javascript')}
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
};

export default LanguageSelector;
