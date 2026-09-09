import React from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
}) => (
  <article className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/25 hover:bg-white/[0.055]">
    <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.05] text-violet-300 transition group-hover:border-violet-400/20 group-hover:bg-violet-400/10">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-6 text-lg font-bold text-white">{title}</h3>
    <p className="mt-3 text-sm font-normal leading-6 text-slate-400">
      {description}
    </p>
  </article>
);
