import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { GetServerSideProps } from 'next';
import { Contributor } from '@/types';
import { FEATURES } from '@/lib/features';
import { FeatureCard } from '@/components/pages/FeatureCard';
import RecentCommits from '@/components/ui/RecentCommits';
import SEOHead from '@/components/seo/SEOHead';
import {
  generateWebsiteStructuredData,
  generateSoftwareApplicationStructuredData,
} from '@/lib/json-ld-schemas';
import { GitHubCommit } from '@/lib/github-api';
import { ROUTES } from '@/lib/router';

interface HomeProps {
  contributors: Contributor[];
  commits: GitHubCommit[];
}

const HomePage: FC<HomeProps> = ({ contributors, commits }) => {
  const { isLoggedIn, user } = useAuthStore();

  // Generate structured data
  const websiteStructuredData = generateWebsiteStructuredData({
    name: 'CodeRacer',
    url: 'https://coderacer.app',
    description:
      'Real-time coding competition platform for improving programming skills through fun, competitive challenges.',
  });

  const softwareAppStructuredData = generateSoftwareApplicationStructuredData({
    '@type': 'SoftwareApplication',
    name: 'CodeRacer',
    description:
      'Real-time coding competition platform where developers can improve their programming skills through competitive coding challenges.',
    url: 'https://coderacer.app',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      ratingCount: 150,
    },
  });

  return (
    <>
      <SEOHead
        title="CodeRacer - Real-time Coding Competitions"
        description="Improve your coding skills by competing with friends in real-time. Join thousands of coders in fun, competitive coding challenges."
        keywords="coding competition, programming practice, real-time coding, algorithm challenges, coding skills, programming race"
        structuredData={[websiteStructuredData, softwareAppStructuredData]}
      />
      <Layout
        title="Code Racer - Real-time Coding Competitions"
        description="Improve your coding skills by competing with friends in real-time"
        contributors={contributors}
      >
        {/* Hero Section */}
        <section
          className="relative w-full min-h-[calc(100vh-4rem)] flex items-center"
          aria-label="Hero section"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/background.png"
              alt="Abstract coding background with dynamic light trails"
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={90}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content */}
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 relative z-20 pt-16">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: Hero Text */}
              <div className="max-w-2xl">
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 text-white drop-shadow-lg">
                  Race Your Code.
                </h1>
                <p className="text-xl md:text-2xl mb-10 text-white/90 drop-shadow-md font-medium">
                  Solve problems live, race against others, and prove your speed
                  under pressure.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {isLoggedIn && user ? (
                    <Link href={ROUTES.USER_PROFILE(user.id)} passHref>
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
                      >
                        <span className="flex items-center gap-2">
                          Start Racing
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      </Button>
                    </Link>
                  ) : (
                    <Link href={ROUTES.LOGIN} passHref>
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
                      >
                        <span className="flex items-center gap-2">
                          Start Racing
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: Recent Updates */}
              <div className="lg:pt-0">
                {/* Recent Updates */}
                <div className="bg-[var(--color-panel)] backdrop-blur-sm border border-[var(--gray-6)] rounded-lg p-0 overflow-hidden">
                  <RecentCommits
                    commits={commits}
                    className="!bg-transparent !border-none !shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="w-full max-w-6xl mx-auto"
          aria-label="Features section"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 py-12 px-4">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.id}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </Layout>
    </>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch contributors and commits in parallel
    const [contributorsResponse, commitsResponse] = await Promise.all([
      fetch('https://api.github.com/repos/Dongmoon29/code_racer/contributors'),
      fetch(
        'https://api.github.com/repos/Dongmoon29/code_racer/commits?per_page=5',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      ),
    ]);

    const contributors = contributorsResponse.ok
      ? await contributorsResponse.json()
      : [];
    const commits = commitsResponse.ok ? await commitsResponse.json() : [];

    return {
      props: {
        contributors,
        commits,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch data:', error);
    }
    return {
      props: {
        contributors: [],
        commits: [],
      },
    };
  }
};
