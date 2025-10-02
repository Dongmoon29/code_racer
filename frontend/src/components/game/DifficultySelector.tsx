import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

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
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <div className="mb-6">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            🏁 Code Racer
          </h1>
          <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))] mb-4">
            Choose Your Racing Circuit
          </h2>
        </div>
        <div className="space-y-3">
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Compete against friends or racers worldwide!
          </p>
          <p className="text-[hsl(var(--muted-foreground))]">
            💨 Select your preferred speed circuit and let the coding race
            begin!
          </p>
        </div>
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
              <h3 className={`text-2xl font-bold mb-2 ${option.color}`}>
                {option.label}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
