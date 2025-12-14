import React, { memo, useState, FC } from 'react';
import CodeEditor from './CodeEditor';
import { getCodeTemplate } from '@/lib/api';
import { ProblemDetail } from '@/types';

interface ProblemPageProps {
  problem: ProblemDetail;
}

const ProblemPage: FC<ProblemPageProps> = memo(({ problem }) => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>('javascript');
  const [code, setCode] = useState<string>(() => {
    return getCodeTemplate(problem, 'javascript');
  });

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    if (
      window.confirm(
        'Changing language will reset your code to template. Continue?'
      )
    ) {
      setSelectedLanguage(newLanguage);
      const template = getCodeTemplate(problem, newLanguage);
      setCode(template);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-1/2 p-4">
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <div className="mt-4">
          <pre>{problem.description}</pre>
        </div>
      </div>

      <div className="w-1/2 p-4">
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="mb-4"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
        </select>

        <CodeEditor
          value={code}
          onChange={setCode}
          language={selectedLanguage}
          theme="dark"
        />
      </div>
    </div>
  );
});

ProblemPage.displayName = 'ProblemPage';

export default ProblemPage;
