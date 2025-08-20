import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { Spinner } from '@/components/ui';

const AuthCallback: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const provider = urlParams.get('provider');

    if (!code || !state || !provider) {
      setError('필수 인증 파라미터가 누락되었습니다.');
      setLoading(false);
      return;
    }

    const exchangeToken = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Exchanging OAuth code for token...');

        const response = await authApi.exchangeToken(code, state, provider);

        if (response.success) {
          console.log('Token exchange successful');

          // 토큰 저장
          localStorage.setItem('authToken', response.token);

          // 사용자 정보 설정
          useAuthStore.getState().login(response.user);

          // 대시보드로 이동
          router.push('/dashboard');
        } else {
          setError(response.message || '토큰 교환에 실패했습니다.');
          setLoading(false);
        }
      } catch (error: unknown) {
        console.error('Token exchange failed:', error);

        let errorMessage = '인증 처리 중 오류가 발생했습니다.';

        if (error && typeof error === 'object' && 'response' in error) {
          const response = (error as { response?: { status?: number } })
            .response;
          if (response?.status === 400) {
            errorMessage = '잘못된 인증 요청입니다.';
          } else if (response?.status === 401) {
            errorMessage = '인증에 실패했습니다. 다시 시도해주세요.';
          } else if (response?.status === 500) {
            errorMessage =
              '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    exchangeToken();
  }, []);

  const handleRetry = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Spinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-900">
              인증 처리 중...
            </h2>
            <p className="text-gray-600">
              로그인을 완료하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">인증 실패</h2>
            <p className="text-gray-600">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                다시 시도
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                로그인 페이지로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
