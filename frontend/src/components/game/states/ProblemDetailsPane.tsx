import React, { FC, memo } from 'react';
import { FileText, Minimize2 } from 'lucide-react';

interface ProblemDetailsPaneProps {
  isExpanded: boolean;
  title: string;
  description: string;
  examples: string;
  constraints: string;
  onToggle: () => void;
}

export const ProblemDetailsPane: FC<ProblemDetailsPaneProps> = memo(
  ({ isExpanded, description, examples, constraints, onToggle }) => {
    if (!isExpanded) {
      return (
        <button
          onClick={onToggle}
          className="w-full h-10 flex items-center justify-center text-[hsl(var(--muted-foreground))] rounded-lg hover:text-white hover:scale-110 transition-all duration-200"
          title="Show Problem Details"
        >
          <FileText className="w-6 h-6" />
        </button>
      );
    }

    return (
      <div className="bg-[hsl(var(--muted))] rounded-lg overflow-auto">
        <div className="px-4 py-2 border-b flex justify-between items-center">
          <span className="font-medium">Problem Details</span>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Problem Description</h2>
            <p className="whitespace-pre-line">{description}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Examples</h3>
            <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))]">
              {examples}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Constraints</h3>
            <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))]">
              {constraints}
            </pre>
          </div>
        </div>
      </div>
    );
  }
);

ProblemDetailsPane.displayName = 'ProblemDetailsPane';
