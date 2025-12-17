import React, { FC } from 'react';
import Link from 'next/link';

interface ProblemListHeaderProps {
  onOpenJsonModal: () => void;
}

export const ProblemListHeader: FC<ProblemListHeaderProps> = ({
  onOpenJsonModal,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Problem Management</h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenJsonModal}
          className="px-6 py-2 rounded-md border"
        >
          + Add New Problem with JSON
        </button>
        <Link href="/admin/problems/create" className="px-6 py-2 rounded-md">
          + Add New Problem
        </Link>
      </div>
    </div>
  );
};
