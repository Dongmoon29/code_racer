import React, { FC } from 'react';
import { getRingClasses } from '@/lib/selector-utils';

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
    color: 'text-[var(--green-11)]',
    bgColor: 'bg-[var(--green-3)] hover:bg-[var(--green-4)] border-[var(--green-6)]',
  },
  {
    value: 'Medium',
    label: '️Racing Circuit',
    color: 'text-[var(--amber-11)]',
    bgColor: 'bg-[var(--amber-3)] hover:bg-[var(--amber-4)] border-[var(--amber-6)]',
  },
  {
    value: 'Hard',
    label: '️Championship Track',
    color: 'text-[var(--red-11)]',
    bgColor: 'bg-[var(--red-3)] hover:bg-[var(--red-4)] border-[var(--red-6)]',
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
              `rounded-md p-4 border w-full h-36 flex flex-col justify-center items-center cursor-pointer transition-colors ` +
              `bg-[var(--color-panel)] border-[var(--gray-6)] ` +
              `${selected ? option.bgColor : ''} ` +
              getRingClasses(selected, option.value, 'difficulty')
            }
          >
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-1 ${option.color}`}>
                {option.label}
              </h3>
              <div className="text-[var(--gray-11)] text-sm">
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
