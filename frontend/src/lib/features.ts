export interface Feature {
  id: string;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    id: 'real-time',
    title: 'Real-time racing',
    description:
      'See your opponent progress live while every second raises the stakes.',
  },
  {
    id: 'diverse-challenges',
    title: 'Focused challenges',
    description:
      'Practice algorithm and data-structure problems across three difficulty levels.',
  },
  {
    id: 'leaderboards',
    title: 'Competitive ladder',
    description:
      'Turn ranked wins into rating gains and track your place on the leaderboard.',
  },
  {
    id: 'multiplayer',
    title: 'Open source',
    description:
      'Inspect the codebase, suggest an improvement, or help build the next feature.',
  },
  {
    id: 'skill-improvement',
    title: 'Fast feedback',
    description:
      'Run against judge cases and get clear results without leaving the arena.',
  },
  {
    id: 'multiple-languages',
    title: 'Your language, your pace',
    description:
      'Solve every challenge in JavaScript, Python, or Go with tailored starter code.',
  },
];
