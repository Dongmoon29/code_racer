import styled from 'styled-components';

// Auth page container
export const AuthPageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    hsl(var(--background)) 0%,
    hsl(var(--muted) / 0.3) 100%
  );
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 28rem; /* 448px */
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(10px);
`;

export const AuthHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const AuthLogo = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

export const AuthTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 0.5rem;
`;

export const AuthSubtitle = styled.p`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  line-height: 1.5;
`;

export const AuthContent = styled.div`
  margin-bottom: 2rem;
`;

export const AuthFooter = styled.div`
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid hsl(var(--border));
`;

export const AuthLink = styled.a`
  color: hsl(var(--primary));
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: hsl(var(--primary) / 0.8);
    text-decoration: underline;
  }
`;

export const AuthDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: hsl(var(--border));
  }

  span {
    padding: 0 1rem;
    color: hsl(var(--muted-foreground));
    font-size: 0.875rem;
    background: hsl(var(--card));
  }
`;

export const SocialButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

export const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: hsl(var(--accent));
    border-color: hsl(var(--accent));
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const ErrorMessage = styled.div`
  margin-bottom: 1rem;
`;

export const SuccessMessage = styled.div`
  margin-bottom: 1rem;
`;

// Form styles
export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--input));
  border-radius: 0.5rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 1px hsl(var(--ring));
  }

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: hsl(var(--muted));
  }
`;

export const FormError = styled.div`
  font-size: 0.75rem;
  color: hsl(var(--destructive));
  margin-top: 0.25rem;
`;

export const FormButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: hsl(var(--primary) / 0.9);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const ForgotPasswordLink = styled.a`
  display: block;
  text-align: right;
  font-size: 0.875rem;
  color: hsl(var(--primary));
  text-decoration: none;
  margin-top: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

// Loading overlay
export const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: hsl(var(--background) / 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  border-radius: 1rem;
`;
