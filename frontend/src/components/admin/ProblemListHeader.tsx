import React, { FC } from 'react';
import Link from 'next/link';

interface ProblemListHeaderProps {
  onOpenJsonModal: () => void;
}

export const ProblemListHeader: FC<ProblemListHeaderProps> = ({
  onOpenJsonModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
      <h1 className="text-3xl font-bold">Problem Management</h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenJsonModal}
          className="px-4 py-2 rounded-md border"
        >
          +JSON
        </button>
        <Link href="/admin/problems/create" className="px-4 py-2 rounded-md">
          +FORM
        </Link>
      </div>
    </div>
  );
};
