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
    title: 'Real-time Competitions',
    description:
      'Compete against friends or other coders in real-time coding challenges. See who can solve problems fastest!',
    icon: Clock,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'diverse-challenges',
    title: 'Diverse Challenges',
    description:
      'From algorithms to data structures, our platform offers a wide range of coding problems to test your skills.',
    icon: Code,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'leaderboards',
    title: 'Leaderboards',
    description:
      'Track your progress, earn points, and climb the ranks to become the ultimate Code Racer champion.',
    icon: Trophy,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'multiplayer',
    title: 'Multiplayer Experience',
    description:
      'Create private rooms to challenge your friends or join public competitions with coders worldwide.',
    icon: Users,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'skill-improvement',
    title: 'Skill Improvement',
    description:
      'Sharpen your programming skills through competitive practice and instant feedback.',
    icon: Zap,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'multiple-languages',
    title: 'Multiple Languages',
    description:
      'Solve problems in your preferred programming language, including Python, JavaScript, Java, and more.',
    icon: Code,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
];
