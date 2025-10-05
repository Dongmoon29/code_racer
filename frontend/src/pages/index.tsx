import React, { FC, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { GetStaticProps } from 'next';
import { Contributor } from '@/types';
import { FEATURES } from '@/lib/features';
import { FeatureCard } from '@/components/pages/FeatureCard';
import { motion, useScroll, useTransform } from 'framer-motion';
import RecentCommits from '@/components/ui/RecentCommits';

interface HomeProps {
  contributors: Contributor[];
}

const HomePage: FC<HomeProps> = ({ contributors }) => {
  const { isLoggedIn } = useAuthStore();
  // Framer Motion 스크롤 애니메이션
  const heroRef = useRef(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  });
  const heroScale = useTransform(heroScrollProgress, [0, 1], [1, 1.5]);
  const heroX = useTransform(heroScrollProgress, [0, 1], [-120, 80]);
  const heroY = useTransform(heroScrollProgress, [0, 1], [-80, 100]);

  const hero2Ref = useRef(null);
  const { scrollYProgress: hero2ScrollProgress } = useScroll({
    target: hero2Ref,
    offset: ['start end', 'end start'],
  });
  const hero2Scale = useTransform(hero2ScrollProgress, [0, 1], [1, 1.6]);
  const hero2X = useTransform(hero2ScrollProgress, [0, 1], [-100, 70]);
  const hero2Y = useTransform(hero2ScrollProgress, [0, 1], [-60, 90]);

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
            // className="object-cover opacity-20"
            className="object-cover !opacity-75 !dark:opacity-20"
            priority
          />
        </div>

        {/* Content */}
        <div className="w-full relative z-20 flex flex-col items-center text-center py-24">
          <div className="mb-8" ref={heroRef}>
            <motion.div
              style={{
                scale: heroScale,
                x: heroX,
                y: heroY,
              }}
            >
              <Image
                src="/code_racer_hero.png"
                alt="CodeRacer Hero"
                width={300}
                height={192}
                className="mx-auto animate-pulse drop-shadow-2xl w-48 h-auto md:w-56 lg:w-64 xl:w-72"
                priority
              />
            </motion.div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 drop-shadow-lg ">
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
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      {/* Recent Updates Section */}
      <div className="w-full max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <RecentCommits maxCommits={5} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-bold mb-4">🚀 Project Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Working on game creation & game deletion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Working on dashboard UI</span>
                </div>
                <div className="text-md font-extrabold mb-4 mt-10">
                  This project is still under development!! and it&apos;s open
                  source so you can see the code and contribute to it!
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="https://github.com/Dongmoon29/code_racer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  View on GitHub
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
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
            className="object-cover !opacity-60 !dark:opacity-20"
            priority
          />
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center text-center py-24">
          <div className="mb-8" ref={hero2Ref}>
            <motion.div
              style={{
                scale: hero2Scale,
                x: hero2X,
                y: hero2Y,
              }}
            >
              <Image
                src="/code_racer_hero2.png"
                alt="CodeRacer Hero 2"
                width={300}
                height={192}
                className="mx-auto animate-pulse drop-shadow-2xl w-48 h-auto md:w-56 lg:w-64 xl:w-72"
                priority
              />
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg ">
            Ready to Race?
          </h2>
          <p className="text-xl mb-10 max-w-2xl drop-shadow-md font-medium">
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
