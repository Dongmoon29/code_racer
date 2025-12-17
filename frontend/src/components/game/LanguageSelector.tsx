import React, { memo, FC, useMemo } from 'react';
import { Select } from '@/components/ui/Select';

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
    const options = useMemo(
      () =>
        LANGUAGES.map((language) => ({
          value: language.id,
          label: language.name,
        })),
      []
    );

    return (
      <div className="flex items-center">
        <Select
          value={selectedLanguage}
          onChange={(value) => onChange(value as SupportedLanguage)}
          options={options}
          disabled={disabled}
          size="1"
          variant="surface"
          className="min-w-[120px]"
        />
      </div>
    );
  }
);

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
