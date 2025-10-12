import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { RegisterForm } from '../components/dynamic';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // Redirect logged-in users to dashboard when accessing registration page
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
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col items-center justify-center">
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
                sizes="50vw"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
