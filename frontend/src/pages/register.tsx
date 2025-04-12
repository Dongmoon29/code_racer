import React from 'react';
import Layout from '../components/layout/Layout';
import RegisterForm from '../components/auth/RegisterForm';
import Image from 'next/image';

const RegisterPage: React.FC = () => {
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
        <div className="hidden md:block md:w-1/2 bg-[hsl(var(--card))]">
          <div className="relative h-full w-full">
            <Image
              src={'/coderacer.png'}
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

export default RegisterPage;
