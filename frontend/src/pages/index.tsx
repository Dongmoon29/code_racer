import React from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { Code, Trophy, Users, Clock, Zap } from 'lucide-react';
import { GetStaticProps } from 'next';

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface HomeProps {
  contributors: Contributor[];
}

const HomePage: React.FC<HomeProps> = ({ contributors }) => {
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
          <h1 className="text-5xl font-bold mb-6 text-[hsl(var(--foreground))]">
            Welcome to CodeRacer
          </h1>
          <p className="text-xl mb-10 max-w-2xl text-[hsl(var(--muted-foreground))]">
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
          <Card>
            <div className="p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
              Real-time Competitions
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Compete against friends or other coders in real-time coding
              challenges. See who can solve problems fastest!
            </p>
          </Card>

          <Card>
            <div className="p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Code className="h-8 w-8 text-indigo-900 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
              Diverse Challenges
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              From algorithms to data structures, our platform offers a wide
              range of coding problems to test your skills.
            </p>
          </Card>

          <Card>
            <div className="p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
              Leaderboards
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Track your progress, earn points, and climb the ranks to become
              the ultimate Code Racer champion.
            </p>
          </Card>

          <Card>
            <div className="p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
              Multiplayer Experience
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Create private rooms to challenge your friends or join public
              competitions with coders worldwide.
            </p>
          </Card>

          <Card>
            <div className="p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
              Skill Improvement
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Sharpen your programming skills through competitive practice and
              instant feedback.
            </p>
          </Card>

          <Card>
            <div className="p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Code className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
              Multiple Languages
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Solve problems in your preferred programming language, including
              Python, JavaScript, Java, and more.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 px-4">
          <h2 className="text-3xl font-bold mb-6 text-[hsl(var(--foreground))]">
            Ready to Race?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-[hsl(var(--muted-foreground))]">
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
    console.error('Failed to fetch contributors:', error);
    return {
      props: {
        contributors: [],
      },
    };
  }
};
