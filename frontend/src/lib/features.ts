import { Clock, Code, Trophy, Users, Zap } from 'lucide-react';

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: typeof Clock; // 모든 아이콘이 LucideIcon 타입
  iconColor: string;
}

export const FEATURES: Feature[] = [
  {
    id: 'real-time',
    title: 'Real-time racing',
    description:
      'See your opponent progress live while every second raises the stakes.',
    icon: Clock,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'diverse-challenges',
    title: 'Focused challenges',
    description:
      'Practice algorithm and data-structure problems across three difficulty levels.',
    icon: Code,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'leaderboards',
    title: 'Competitive ladder',
    description:
      'Turn ranked wins into rating gains and track your place on the leaderboard.',
    icon: Trophy,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'multiplayer',
    title: 'Open source',
    description:
      'Inspect the codebase, suggest an improvement, or help build the next feature.',
    icon: Users,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'skill-improvement',
    title: 'Fast feedback',
    description:
      'Run against judge cases and get clear results without leaving the arena.',
    icon: Zap,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'multiple-languages',
    title: 'Your language, your pace',
    description:
      'Solve every challenge in JavaScript, Python, or Go with tailored starter code.',
    icon: Code,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
];
