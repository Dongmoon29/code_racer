import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import { LeetCodeDetail, getCodeTemplate } from '@/lib/api';

interface ProblemPageProps {
  problem: LeetCodeDetail;
}

const ProblemPage: React.FC<ProblemPageProps> = ({ problem }) => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>('javascript');
  const [code, setCode] = useState<string>(() => {
    return getCodeTemplate(problem, 'javascript');
  });

  // 언어가 변경될 때만 사용자에게 템플릿 변경 여부를 확인
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
          <option value="java">Java</option>
          <option value="cpp">C++</option>
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
};

export default ProblemPage;
