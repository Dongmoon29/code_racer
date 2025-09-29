import React from 'react';
import { Button } from '@/components/ui/Button';
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
    description: '기본적인 문제들',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    icon: '🟢',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: '중간 난이도 문제들',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    icon: '🟡',
  },
  {
    value: 'Hard',
    label: 'Hard',
    description: '고급 알고리즘 문제들',
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
          상대방과 실시간 코딩 대결
        </p>
        <p className="text-[hsl(var(--muted-foreground))]">
          난이도를 선택하여 매칭을 시작하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {difficultyOptions.map((option) => (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all duration-200 transform hover:scale-105 ${
              option.bgColor
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <Button
                variant="outline"
                className={`w-full ${option.color} border-current hover:bg-current hover:text-white`}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onSelect(option.value);
                }}
              >
                {option.label} 선택
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>🎯 매칭은 같은 난이도의 다른 플레이어와 진행됩니다</p>
        <p>⚡ 평균 매칭 시간: Easy 30초, Medium 1분, Hard 2분</p>
      </div>
    </div>
  );
};

export default DifficultySelector;
