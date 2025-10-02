import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import LoginForm from '../components/auth/LoginForm';
import Image from 'next/image';
import { Alert } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // 이미 로그인된 사용자가 로그인 페이지에 접근하면 dashboard로 리다이렉트
    if (isLoggedIn) {
      router.replace('/dashboard');
      return;
    }

    if (router.query.registered === 'true') {
      setMessage(
        'Registration successful! Please login with your new account.'
      );
    }
  }, [isLoggedIn, router.query, router]);

  return (
    <Layout
      title="Login | CodeRacer"
      description="Login to CodeRacer to start competing in real-time coding challenges"
    >
      <div className="flex w-full min-h-[calc(100vh-80px)]">
        {/* Left Column - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
                Sign In to CodeRacer
              </h1>
            </div>

            {message && (
              <Alert variant="success" className="mb-6">
                <p>{message}</p>
              </Alert>
            )}

            <LoginForm />
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
          <div className="relative h-full w-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Image
                src="/coderacer.png"
                alt="Code Racer Racing Track"
                width={400}
                height={300}
                className="mx-auto animate-bounce"
                priority
              />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800">
                  🏁 Join the Racing Circuit
                </h3>
                <p className="text-gray-600">Fast coding, faster learning!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
