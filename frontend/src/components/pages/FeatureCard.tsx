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
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card/50 to-card border-2 hover:border-primary/30">
      <div className="p-6">
        <div
          className={`p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 bg-gradient-to-br from-primary/10 to-primary/5 group-hover:scale-110 transition-transform duration-300`}
        ></div>
        <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </div>
    </Card>
  );
};
