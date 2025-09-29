import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MatchmakingWebSocketClient, {
  type MatchingStatusMessage,
  type MatchFoundMessage,
} from '@/lib/matchmaking-websocket';
import DifficultySelector, { type Difficulty } from './DifficultySelector';
import MatchingLoader from './MatchingLoader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';

type MatchingState = 'idle' | 'connecting' | 'searching' | 'found' | 'error';

interface MatchingScreenProps {
  onMatchFound?: (gameId: string) => void;
}

export const MatchingScreen: React.FC<MatchingScreenProps> = ({
  onMatchFound,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();

  // 상태 관리
  const [matchingState, setMatchingState] = useState<MatchingState>('idle');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 매칭 상태 정보
  const [queuePosition, setQueuePosition] = useState<number | undefined>();
  const [waitTimeSeconds, setWaitTimeSeconds] = useState<number>(0);
  const [estimatedWaitSeconds, setEstimatedWaitSeconds] = useState<
    number | undefined
  >();

  // WebSocket 클라이언트 참조
  const wsClientRef = useRef<MatchmakingWebSocketClient | null>(null);

  // 컴포넌트 언마운트 시 WebSocket 정리
  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, []);

  // 매칭 시작 함수
  const startMatching = async (difficulty: Difficulty) => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setMatchingState('connecting');
      setSelectedDifficulty(difficulty);
      setError(null);

      // WebSocket 클라이언트 생성
      const wsClient = new MatchmakingWebSocketClient({
        onConnect: () => {
          console.log('Matchmaking WebSocket connected');
          setMatchingState('searching');
          // 연결 후 즉시 매칭 요청
          wsClient.startMatching(difficulty);
        },

        onStatusUpdate: (message: MatchingStatusMessage) => {
          console.log('Matching status update:', message);
          setQueuePosition(message.queue_position);
          setWaitTimeSeconds(message.wait_time_seconds || 0);
          setEstimatedWaitSeconds(message.estimated_wait_seconds);

          if (message.status === 'cancelled') {
            setMatchingState('idle');
            setSelectedDifficulty(null);
          }
        },

        onMatchFound: (message: MatchFoundMessage) => {
          console.log('Match found:', message);
          setMatchingState('found');

          // WebSocket 연결 해제
          if (wsClientRef.current) {
            wsClientRef.current.disconnect();
            wsClientRef.current = null;
          }

          // 매칭 완료 처리
          if (onMatchFound) {
            onMatchFound(message.game_id);
          } else {
            // 기본 동작: 게임 페이지로 리다이렉트
            router.push(`/game/${message.game_id}`);
          }
        },

        onDisconnect: () => {
          console.log('Matchmaking WebSocket disconnected');
          if (matchingState === 'searching') {
            setError('연결이 끊어졌습니다. 다시 시도해주세요.');
            setMatchingState('error');
          }
        },

        onError: (error) => {
          console.error('Matchmaking WebSocket error:', error);
          setError('연결 오류가 발생했습니다. 다시 시도해주세요.');
          setMatchingState('error');
        },
      });

      wsClientRef.current = wsClient;

      // WebSocket 연결 시도
      await wsClient.connect();
    } catch (error) {
      console.error('Failed to start matching:', error);
      setError('매칭을 시작할 수 없습니다. 다시 시도해주세요.');
      setMatchingState('error');
    }
  };

  // 매칭 취소 함수
  const cancelMatching = () => {
    if (wsClientRef.current) {
      wsClientRef.current.cancelMatching();
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }

    setMatchingState('idle');
    setSelectedDifficulty(null);
    setQueuePosition(undefined);
    setWaitTimeSeconds(0);
    setEstimatedWaitSeconds(undefined);
    setError(null);
  };

  // 에러 상태에서 다시 시도
  const retryMatching = () => {
    setError(null);
    setMatchingState('idle');
  };

  // 로딩 상태 표시
  if (matchingState === 'connecting') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">
              매칭 서버에 연결 중...
            </h2>
            <p className="text-[hsl(var(--muted-foreground))]">
              잠시만 기다려주세요
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러 상태 표시
  if (matchingState === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              오류 발생
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-x-4">
              <Button onClick={retryMatching} variant="outline">
                다시 시도
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="ghost">
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 매칭 완료 상태 (잠깐 표시)
  if (matchingState === 'found') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">
              매칭 완료!
            </h2>
            <p className="text-green-600">게임 페이지로 이동 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 매칭 대기 중 상태
  if (matchingState === 'searching' && selectedDifficulty) {
    return (
      <MatchingLoader
        difficulty={selectedDifficulty}
        queuePosition={queuePosition}
        waitTimeSeconds={waitTimeSeconds}
        estimatedWaitSeconds={estimatedWaitSeconds}
        onCancel={cancelMatching}
      />
    );
  }

  // 기본 상태: 난이도 선택
  return (
    <DifficultySelector
      onSelect={startMatching}
      disabled={matchingState !== 'idle'}
    />
  );
};

export default MatchingScreen;
