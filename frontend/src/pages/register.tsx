import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import RegisterForm from '../components/auth/RegisterForm';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // 이미 로그인된 사용자가 회원가입 페이지에 접근하면 dashboard로 리다이렉트
    if (isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, router]);

  return (
    <Layout
      title="Register | Code Racer"
      description="Create a new account for Code Racer"
    >
      <div className="flex w-full min-h-[calc(100vh-80px)]">
        {/* Left Column - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
                Sign Up for CodeRacer
              </h1>
            </div>

            <RegisterForm />
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <div className="relative h-full w-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Image
                src="/coderacer.png"
                alt="Code Racer Champion Track"
                width={400}
                height={300}
                className="mx-auto animate-pulse hover:scale-105 transition-transform duration-300"
                priority
              />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800">
                  🏆 Become a Code Champion
                </h3>
                <p className="text-gray-600">
                  Start your racing journey today!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
