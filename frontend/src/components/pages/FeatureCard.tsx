import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface FeatureCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  iconColor,
  title,
  description,
}) => {
  return (
    <Card>
      <div
        className={`p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4 bg-gradient-to-br from-transparent via-transparent to-transparent`}
      >
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
};
