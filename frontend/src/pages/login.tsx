import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { LoginForm } from '../components/dynamic';
import Image from 'next/image';
import { Alert } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const { isLoggedIn, isLoading } = useAuthStore();

  useEffect(() => {
    // Only redirect if we're sure the user is logged in
    // and we're not still loading
    if (!isLoading && isLoggedIn) {
      router.replace('/dashboard');
      return;
    }

    if (router.query.registered === 'true') {
      setMessage(
        'Registration successful! Please login with your new account.'
      );
    }
  }, [isLoading, isLoggedIn, router.query, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <Layout
        title="Login | CodeRacer"
        description="Login to CodeRacer to start competing in real-time coding challenges"
      >
        <div className="flex w-full min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Login | CodeRacer"
      description="Login to CodeRacer to start competing in real-time coding challenges"
    >
      <div className="flex w-full min-h-[calc(100vh-80px)]">
        {/* Left Column - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col items-center justify-center">
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
        <div className="hidden md:block md:w-1/2 overflow-hidden">
          <div className="relative h-full w-full">
            <motion.div
              className="relative h-full w-full"
              animate={{
                rotate: [0, 1, 0],
                x: [0, 2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Image
                src="/code_racer_hero.webp"
                alt="Code Racer illustration"
                fill
                style={{ objectFit: 'contain' }}
                className="p-4"
                priority
              />
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
