import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import LoginForm from '../components/auth/LoginForm';
import Image from 'next/image';
import { Alert } from '@/components/ui/alert';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.registered === 'true') {
      setMessage(
        'Registration successful! Please login with your new account.'
      );
    }
  }, [router.query]);

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
        <div className="hidden md:block md:w-1/2 bg-sky-100">
          <div className="relative h-full w-full">
            <Image
              src="/coderacer.png"
              alt="Code Racer illustration"
              fill
              style={{ objectFit: 'contain' }}
              className="p-4"
              priority
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
