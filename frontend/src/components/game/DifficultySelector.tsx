import React from 'react';
// Card components removed in favor of button-based cards

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

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  onSelect,
  disabled = false,
  value,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Racing-style difficulty cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {difficultyOptions.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => !disabled && onSelect(option.value)}
              className={
                `relative group rounded-2xl p-4 text-left border transition-all duration-200 w-full h-36 flex flex-col justify-center items-start cursor-pointer ` +
                `bg-[hsl(var(--background))] border-[hsl(var(--border))] ` +
                (selected
                  ? 'ring-2 ring-offset-2 ring-indigo-500 -translate-y-0.5'
                  : 'hover:-translate-y-0.5')
              }
            >
              <div
                className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-sky-500 to-violet-500 blur-sm`}
              ></div>
              <div className="relative text-center">
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
    </div>
  );
};

export default DifficultySelector;
