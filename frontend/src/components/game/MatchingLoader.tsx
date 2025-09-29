import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui';
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
  queuePosition,
  waitTimeSeconds = 0,
  estimatedWaitSeconds,
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedMessage = (): string => {
    if (estimatedWaitSeconds) {
      if (estimatedWaitSeconds <= 30) return '곧 매칭될 예정입니다!';
      if (estimatedWaitSeconds <= 60) return '약 1분 내로 매칭 예정';
      return `약 ${Math.ceil(estimatedWaitSeconds / 60)}분 후 매칭 예정`;
    }
    return '매칭 상대를 찾는 중...';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className={`${config.bgColor} border-2`}>
        <CardContent className="p-8 text-center">
          {/* 매칭 상태 표시 */}
          <div className="mb-6">
            <div className="flex justify-center items-center mb-4">
              <Spinner size="lg" />
              <span className="text-2xl">{config.icon}</span>
            </div>
            <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
              상대방을 찾는 중...
            </h2>
            <p className={`text-lg ${config.color} font-semibold`}>
              난이도: {difficulty}
            </p>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {formatTime(localWaitTime)}
              </div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                대기 시간
              </div>
            </div>

            {queuePosition !== undefined && (
              <div className="bg-white/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  #{queuePosition}
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  대기 순서
                </div>
              </div>
            )}

            {estimatedWaitSeconds !== undefined && (
              <div className="bg-white/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  {formatTime(estimatedWaitSeconds)}
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  예상 시간
                </div>
              </div>
            )}
          </div>

          {/* 상태 메시지 */}
          <div className="mb-6">
            <p className="text-[hsl(var(--muted-foreground))] mb-2">
              {getEstimatedMessage()}
            </p>
            <div className="flex justify-center items-center space-x-2 text-sm text-[hsl(var(--muted-foreground))]">
              <span>🔍</span>
              <span>같은 난이도의 플레이어를 찾고 있습니다</span>
            </div>
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
            매칭 취소
          </Button>

          {/* 도움말 */}
          <div className="mt-6 text-xs text-[hsl(var(--muted-foreground))] space-y-1">
            <p>💡 팁: 매칭이 오래 걸린다면 다른 난이도를 시도해보세요</p>
            <p>🎮 매칭이 완료되면 자동으로 게임이 시작됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchingLoader;
