import React, { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { type Difficulty } from './DifficultySelector';
import { MATCHING_LOADER_CONSTANTS } from './constants/matching-loader-constants';

interface MatchingLoaderProps {
  difficulty: Difficulty;
  waitTimeSeconds?: number;
  onCancel: () => void;
}

const difficultyConfig = MATCHING_LOADER_CONSTANTS.DIFFICULTY_CONFIG;

export const MatchingLoader: React.FC<MatchingLoaderProps> = memo(
  ({ difficulty, waitTimeSeconds = 0, onCancel }) => {
    const [, setLocalWaitTime] = useState(waitTimeSeconds);
    const config = difficultyConfig[difficulty];

    // 로컬 타이머 (서버에서 업데이트가 안 올 때를 대비)
    useEffect(() => {
      const interval = setInterval(() => {
        setLocalWaitTime(
          (prev) => prev + MATCHING_LOADER_CONSTANTS.TIMER.INCREMENT_VALUE
        );
      }, MATCHING_LOADER_CONSTANTS.TIMER.INTERVAL_MS);

      return () => {
        clearInterval(interval);
        // onCancel();
      };
    }, []);

    // 서버에서 업데이트가 오면 로컬 타이머 동기화
    useEffect(() => {
      setLocalWaitTime(waitTimeSeconds);
    }, [waitTimeSeconds]);

    // 컴포넌트 언마운트 시 자동 취소 호출 (React StrictMode 이중 호출 대응)
    useEffect(() => {
      const hasRunOnceRef = { current: false } as { current: boolean };
      return () => {
        if (hasRunOnceRef.current) {
          onCancel();
        } else {
          // StrictMode에서 첫 번째 cleanup은 무시
          hasRunOnceRef.current = true;
        }
      };
    }, [onCancel]);

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            {/* 상태 헤더 */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <motion.h2
                className="text-3xl font-bold text-foreground mb-2"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                Searching for opponent
              </motion.h2>
              <p className={`text-sm ${config.color} font-medium`}>
                Difficulty: {config.icon} {difficulty}
              </p>
            </motion.div>

            {/* 로딩 비주얼 */}
            <div className="mb-8 flex items-center justify-center">
              <div className="relative">
                <motion.div
                  className="size-14 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-xl absolute inset-0"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="size-14 rounded-full border-2 border-primary/60 flex items-center justify-center relative"
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <motion.div
                    className="size-6 rounded-full bg-primary"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            </div>

            {/* 보조 로딩 도트 */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block size-2 rounded-full bg-muted-foreground/60"
                  animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.12,
                  }}
                />
              ))}
            </div>

            {/* 취소 버튼 */}
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                onClick={onCancel}
                className="min-w-[140px] border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Cancel matching
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

MatchingLoader.displayName = 'MatchingLoader';

export default MatchingLoader;
