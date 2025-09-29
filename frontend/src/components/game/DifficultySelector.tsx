import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DifficultyOption {
  value: Difficulty;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

const difficultyOptions: DifficultyOption[] = [
  {
    value: 'Easy',
    label: 'Easy',
    description: 'For beginners',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    icon: '🟢',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: 'For intermediate',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    icon: '🟡',
  },
  {
    value: 'Hard',
    label: 'Hard',
    description: 'For advanced',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    icon: '🔴',
  },
];

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
          Code Racer
        </h1>
        <p className="text-xl text-[hsl(var(--muted-foreground))] mb-2">
          Compete against friends or other coders in real-time coding
        </p>
        <p className="text-[hsl(var(--muted-foreground))]">
          Select a difficulty to start matching
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {difficultyOptions.map((option) => (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all duration-200 transform hover:scale-105 
              `}
            onClick={() => !disabled && onSelect(option.value)}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">{option.icon}</div>
              <h3 className={`text-2xl font-bold mb-2 ${option.color}`}>
                {option.label}
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                {option.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
