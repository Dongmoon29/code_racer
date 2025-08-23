import styled from 'styled-components';

// Page container
export const HomePageContainer = styled.div`
  width: 100%;
  max-width: 1152px; /* 6xl */
  margin: 0 auto;
`;

// Hero section
export const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4rem 0;
`;

export const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: hsl(var(--foreground));
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

export const HeroDescription = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2.5rem;
  max-width: 42rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.125rem;
    max-width: 36rem;
  }
`;

export const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

// Features section
export const FeaturesSection = styled.div`
  padding: 4rem 0;
`;

export const SectionTitle = styled.h2`
  font-size: 2.25rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: hsl(var(--foreground));
`;

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;

export const FeatureCard = styled.div`
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
    border-color: hsl(var(--primary));
  }
`;

export const FeatureIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
`;

export const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: hsl(var(--foreground));
`;

export const FeatureDescription = styled.p`
  color: hsl(var(--muted-foreground));
  line-height: 1.6;
  margin: 0;
`;

// Steps section
export const StepsSection = styled.div`
  padding: 4rem 0;
  background: hsl(var(--muted) / 0.3);
  border-radius: 1rem;
  margin: 4rem 0;
`;

export const StepsContainer = styled.div`
  max-width: 4xl;
  margin: 0 auto;
  padding: 0 2rem;
`;

export const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

export const StepCard = styled.div`
  text-align: center;
  padding: 1.5rem;
`;

export const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 1.25rem;
  font-weight: 600;
`;

export const StepTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: hsl(var(--foreground));
`;

export const StepDescription = styled.p`
  color: hsl(var(--muted-foreground));
  line-height: 1.6;
  margin: 0;
`;

// Contributors section
export const ContributorsSection = styled.div`
  padding: 4rem 0;
`;

export const ContributorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

export const ContributorCard = styled.a`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  text-decoration: none;
  color: hsl(var(--foreground));
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    border-color: hsl(var(--primary));
  }
`;

export const ContributorAvatar = styled.img`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid hsl(var(--border));
`;

export const ContributorInfo = styled.div`
  flex: 1;
`;

export const ContributorName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

export const ContributorStats = styled.div`
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
`;

// CTA section
export const CTASection = styled.div`
  padding: 4rem 0;
  text-align: center;
  background: hsl(var(--primary) / 0.05);
  border-radius: 1rem;
  margin: 4rem 0;
`;

export const CTATitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: hsl(var(--foreground));
`;

export const CTADescription = styled.p`
  font-size: 1.125rem;
  margin-bottom: 2rem;
  color: hsl(var(--muted-foreground));
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
`;

export const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;
