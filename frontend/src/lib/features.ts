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
    title: '🏎️ Real-time Racing',
    description:
      'Race against friends or coders globally in lightning-fast coding sprints! Watch the competition unfold in real-time.',
    icon: Clock,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'diverse-challenges',
    title: '🎯 Challenging Tracks',
    description:
      'Tackle diverse coding tracks from algorithms to data structures. Each problem is a new lap in your coding journey!',
    icon: Code,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'leaderboards',
    title: '🏆 Championship Ladder',
    description:
      'Climb the championship ladder! Track your racing stats, earn victory points, and become the ultimate Code Racer.',
    icon: Trophy,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'multiplayer',
    title: '🤝 Racing Teams',
    description:
      'Create private racing circuits with friends or join the global racing community. Team up or compete solo!',
    icon: Users,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'skill-improvement',
    title: '⚡ Speed Training',
    description:
      'Boost your coding velocity through intense racing sessions. Fast feedback and competitive practice make you unstoppable!',
    icon: Zap,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'multiple-languages',
    title: '🌍 Multi-Language Circuit',
    description:
      'Choose your racing machine! Support for Python, JavaScript, Java, Go, and more. Race in your favorite language!',
    icon: Code,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
];
