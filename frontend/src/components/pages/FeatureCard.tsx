import React from 'react';
import { Card } from '@/components/ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
}) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gray-900/80 backdrop-blur-md border-2 border-gray-700 hover:border-green-500/50 h-full flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-green-400 transition-colors duration-300 drop-shadow-sm">
          {title}
        </h3>
        <p className="text-white/80 leading-relaxed group-hover:text-white transition-colors duration-300 flex-1">
          {description}
        </p>
      </div>
    </Card>
  );
};
