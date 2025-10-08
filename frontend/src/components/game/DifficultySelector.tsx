import React, { FC } from 'react';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DifficultyOption {
  value: Difficulty;
  label: string;
  color: string;
  bgColor: string;
}

const difficultyOptions: DifficultyOption[] = [
  {
    value: 'Easy',
    label: 'Beginner Circuit',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    value: 'Medium',
    label: '️Racing Circuit',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
  },
  {
    value: 'Hard',
    label: '️Championship Track',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
  },
];

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
  disabled?: boolean;
  value?: Difficulty;
}

export const DifficultySelector: FC<DifficultySelectorProps> = ({
  onSelect,
  disabled = false,
  value,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {difficultyOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value)}
            className={
              `rounded-2xl p-4 border w-full h-36 flex flex-col justify-center items-center cursor-pointer ` +
              `bg-[hsl(var(--background))] border-[hsl(var(--border))] ` +
              (selected
                ? `ring-2 ${
                    option.value === 'Easy'
                      ? 'ring-green-500'
                      : option.value === 'Medium'
                      ? 'ring-yellow-500'
                      : 'ring-red-500'
                  }`
                : '')
            }
          >
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-1 ${option.color}`}>
                {option.label}
              </h3>
              <div className="text-[hsl(var(--muted-foreground))] text-sm">
                {option.value}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DifficultySelector;
