import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { type Difficulty } from './DifficultySelector';

interface MatchingLoaderProps {
  difficulty: Difficulty;
  queuePosition?: number;
  waitTimeSeconds?: number;
  estimatedWaitSeconds?: number;
  onCancel: () => void;
}

const difficultyConfig = {
  Easy: { color: 'text-green-600', bgColor: 'bg-green-50', icon: '🟢' },
  Medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '🟡' },
  Hard: { color: 'text-red-600', bgColor: 'bg-red-50', icon: '🔴' },
};

export const MatchingLoader: React.FC<MatchingLoaderProps> = ({
  difficulty,
  waitTimeSeconds = 0,
  onCancel,
}) => {
  const [localWaitTime, setLocalWaitTime] = useState(waitTimeSeconds);
  const config = difficultyConfig[difficulty];

  // 로컬 타이머 (서버에서 업데이트가 안 올 때를 대비)
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 서버에서 업데이트가 오면 로컬 타이머 동기화
  useEffect(() => {
    setLocalWaitTime(waitTimeSeconds);
  }, [waitTimeSeconds]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className={`border-2`}>
        <CardContent className="p-8 text-center">
          {/* 매칭 상태 표시 */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2 ">
              Matching in progress
            </h2>
            <p className={`text-lg ${config.color} font-semibold`}>
              Difficulty: {difficulty}
            </p>
          </div>

          {/* 매칭 진행 바 (애니메이션) */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 animate-pulse`}
                style={{
                  width: `${Math.min((localWaitTime / 60) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* 취소 버튼 */}
          <Button
            variant="outline"
            onClick={onCancel}
            className="min-w-[120px] border-red-300 text-red-600 hover:bg-red-50"
          >
            Abort Matching
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchingLoader;
