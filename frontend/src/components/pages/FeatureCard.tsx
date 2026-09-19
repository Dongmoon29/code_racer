import React from "react";

interface FeatureCardProps {
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
}) => (
  <article className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/25 hover:bg-white/[0.055]">
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="mt-3 text-sm font-normal leading-6 text-slate-400">
      {description}
    </p>
  </article>
);
