import React from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { ButtonStyled as Button } from '../components/ui';
import { useAuthStore } from '@/stores/authStore';
import { Code, Trophy, Users, Clock, Zap } from 'lucide-react';
import { GetStaticProps } from 'next';
import {
  HomePageContainer,
  HeroSection,
  HeroTitle,
  HeroDescription,
  HeroButtons,
  FeaturesSection,
  SectionTitle,
  FeaturesGrid,
  FeatureCard,
  FeatureIcon,
  FeatureTitle,
  FeatureDescription,
  StepsSection,
  StepsContainer,
  StepsGrid,
  StepCard,
  StepNumber,
  StepTitle,
  StepDescription,
  ContributorsSection,
  ContributorsGrid,
  ContributorCard,
  ContributorAvatar,
  ContributorInfo,
  ContributorName,
  ContributorStats,
  CTASection,
  CTATitle,
  CTADescription,
  CTAButtons,
} from '../components/pages/HomePage.styled';

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

  const features = [
    {
      icon: <Code size={32} />,
      title: 'Real-time Coding',
      description:
        'Code simultaneously with your friends and see their progress in real-time.',
    },
    {
      icon: <Trophy size={32} />,
      title: 'Competitive Racing',
      description:
        'Compete to solve algorithmic challenges faster than your opponents.',
    },
    {
      icon: <Users size={32} />,
      title: 'Multiplayer Rooms',
      description:
        'Create private rooms or join public competitions with developers worldwide.',
    },
    {
      icon: <Clock size={32} />,
      title: 'Time Challenges',
      description:
        'Race against the clock to improve your problem-solving speed.',
    },
    {
      icon: <Zap size={32} />,
      title: 'Instant Feedback',
      description:
        'Get immediate results and detailed explanations for your solutions.',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Sign Up',
      description: 'Create your account and set up your coding profile.',
    },
    {
      number: 2,
      title: 'Join or Create Room',
      description:
        'Find a competition room or create your own private challenge.',
    },
    {
      number: 3,
      title: 'Start Racing',
      description: 'Solve coding problems faster than your opponents to win!',
    },
    {
      number: 4,
      title: 'Track Progress',
      description: 'Review your performance and improve your coding skills.',
    },
  ];

  return (
    <Layout
      title="Code Racer - Real-time Coding Competitions"
      description="Improve your coding skills by competing with friends in real-time"
      contributors={contributors}
    >
      <HomePageContainer>
        {/* Hero Section */}
        <HeroSection>
          <HeroTitle>Welcome to CodeRacer</HeroTitle>
          <HeroDescription>
            Race against your friends to solve coding challenges in real-time.
            Improve your skills, compete for the top spot, and have fun!
          </HeroDescription>

          <HeroButtons>
            {isLoggedIn ? (
              <Link href="/dashboard" passHref>
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" passHref>
                  <Button size="lg">Start Racing</Button>
                </Link>
                <Link href="/register" passHref>
                  <Button variant="outline" size="lg">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </HeroButtons>
        </HeroSection>

        {/* Features Section */}
        <FeaturesSection>
          <SectionTitle>Why Choose CodeRacer?</SectionTitle>
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </FeaturesSection>

        {/* How it Works Section */}
        <StepsSection>
          <StepsContainer>
            <SectionTitle>How It Works</SectionTitle>
            <StepsGrid>
              {steps.map((step, index) => (
                <StepCard key={index}>
                  <StepNumber>{step.number}</StepNumber>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </StepCard>
              ))}
            </StepsGrid>
          </StepsContainer>
        </StepsSection>

        {/* Contributors Section */}
        {contributors && contributors.length > 0 && (
          <ContributorsSection>
            <SectionTitle>Our Contributors</SectionTitle>
            <ContributorsGrid>
              {contributors.slice(0, 8).map((contributor) => (
                <ContributorCard
                  key={contributor.login}
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ContributorAvatar
                    src={contributor.avatar_url}
                    alt={`${contributor.login}'s avatar`}
                  />
                  <ContributorInfo>
                    <ContributorName>{contributor.login}</ContributorName>
                    <ContributorStats>
                      {contributor.contributions} contributions
                    </ContributorStats>
                  </ContributorInfo>
                </ContributorCard>
              ))}
            </ContributorsGrid>
          </ContributorsSection>
        )}

        {/* CTA Section */}
        {!isLoggedIn && (
          <CTASection>
            <CTATitle>Ready to Start Racing?</CTATitle>
            <CTADescription>
              Join thousands of developers who are improving their coding skills
              through competitive programming.
            </CTADescription>
            <CTAButtons>
              <Link href="/register" passHref>
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/login" passHref>
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </CTAButtons>
          </CTASection>
        )}
      </HomePageContainer>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let contributors: Contributor[] = [];

  try {
    const response = await fetch(
      'https://api.github.com/repos/Dongmoon29/code_racer/contributors',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      contributors = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch contributors:', error);
  }

  return {
    props: {
      contributors,
    },
    revalidate: 3600, // Revalidate every hour
  };
};

export default HomePage;
