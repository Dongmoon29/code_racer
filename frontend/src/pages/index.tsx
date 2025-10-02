import React, { FC } from 'react';
import Link from 'next/link';
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
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center py-16">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Welcome to CodeRacer
          </h1>
          <p className="text-xl mb-10 max-w-2xl text-muted-foreground">
            Race against your friends to solve coding challenges in real-time.
            Improve your skills, compete for the top spot, and have fun!
          </p>

          {isLoggedIn ? (
            <Link href="/dashboard" passHref>
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <div className="space-x-4">
              <Link href="/login" passHref>
                <Button size="lg">Start Racing</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
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

        {/* CTA Section */}
        <div className="text-center py-16 px-4">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Ready to Race?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            Join thousands of coders who are improving their skills through fun,
            competitive coding challenges.
          </p>

          {isLoggedIn ? (
            <Link href="/dashboard" passHref>
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <Link href="/register" passHref>
              <Button size="lg">Sign Up Free</Button>
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
