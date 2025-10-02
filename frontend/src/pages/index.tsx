import React, { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { GetStaticProps } from 'next';
import { Contributor } from '@/types';
import { FEATURES } from '@/lib/features';
import { FeatureCard } from '@/components/pages/FeatureCard';

interface HomeProps {
  contributors: Contributor[];
}

const HomePage: FC<HomeProps> = ({ contributors }) => {
  const { isLoggedIn } = useAuthStore();

  return (
    <Layout
      title="Code Racer - Real-time Coding Competitions"
      description="Improve your coding skills by competing with friends in real-time"
      contributors={contributors}
    >
      {/* Hero Section */}
      <div className="relative w-full">
        {/* Background Track Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0% 95%)',
          }}
        >
          <Image
            src="/track.png"
            alt="Racing Track Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-green-900/30 z-10"></div>
        </div>

        {/* Content */}
        <div className="w-full relative z-20 flex flex-col items-center text-center py-24">
          <div className="mb-8">
            <Image
              src="/code_racer_hero.png"
              alt="CodeRacer Hero"
              width={200}
              height={128}
              className="mx-auto animate-pulse hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-6xl font-bold mb-6 drop-shadow-lg ">
            Welcome to CodeRacer
          </h1>
          <p className="text-xl mb-10 max-w-2xl drop-shadow-md font-medium">
            Race against your friends to solve coding challenges in real-time.
            Improve your skills, compete for the top spot, and have fun!
          </p>

          {isLoggedIn ? (
            <Link href="/dashboard" passHref>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  🏎️ Go to Dashboard
                </span>
              </Button>
            </Link>
          ) : (
            <div className="space-x-4">
              <Link href="/login" passHref>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    🏃‍♂️ Start Racing
                  </span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 py-12 px-4">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              iconColor={feature.iconColor}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      {/* Second Hero Section - CTA */}
      <div className="relative w-full mt-16">
        {/* Background Track Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            clipPath: 'polygon(0 100%, 100% 100%, 100% 25%, 0 5%)',
          }}
        >
          <Image
            src="/track2.png"
            alt="Second Racing Track Background"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800/40 via-purple-800/40 to-green-800/40 z-10"></div>
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center text-center py-24">
          <div className="mb-8">
            <Image
              src="/code_racer_hero2.png"
              alt="CodeRacer Hero 2"
              width={200}
              height={128}
              className="mx-auto animate-pulse hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
              priority
            />
          </div>
          <h2 className="text-5xl font-bold mb-6 drop-shadow-lg ">
            Ready to Race?
          </h2>
          <p className="text-xl mb-10 max-w-2xl text-gray-100 drop-shadow-md font-medium">
            🏁 Join thousands of coders who are improving their skills through
            fun, competitive coding challenges.
          </p>

          {isLoggedIn ? (
            <Link href="/dashboard" passHref>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  🏎️ Go to Dashboard
                </span>
              </Button>
            </Link>
          ) : (
            <Link href="/register" passHref>
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center gap-2">🚀 Sign Up Free</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;

export const getStaticProps: GetStaticProps = async () => {
  try {
    const response = await fetch(
      'https://api.github.com/repos/Dongmoon29/code_racer/contributors'
    );
    const contributors = await response.json();

    return {
      props: {
        contributors,
      },
      revalidate: 3600, // 1시간마다 재생성
    };
  } catch (error) {
    console.error('Failed to fetch contributors', error);
    return {
      props: {
        contributors: [],
      },
    };
  }
};
