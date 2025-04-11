import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import { LeetCodeDetail, getCodeTemplate } from '@/lib/api';

interface ProblemPageProps {
  problem: LeetCodeDetail;
}

const ProblemPage: React.FC<ProblemPageProps> = ({ problem }) => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>('javascript');
  const [code, setCode] = useState<string>(() => {
    // 초기 상태를 설정할 때도 템플릿을 로드
    return getCodeTemplate(problem, 'javascript');
  });

  useEffect(() => {
    const template = getCodeTemplate(problem, selectedLanguage);
    setCode(template);
  }, [problem, selectedLanguage]);

  return (
    <div className="flex h-full">
      <div className="w-1/2 p-4">
        {/* 문제 설명 부분 */}
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <div className="mt-4">
          <pre>{problem.description}</pre>
        </div>
        {/* ... 다른 문제 정보들 ... */}
      </div>

      <div className="w-1/2 p-4">
        {/* 언어 선택 드롭다운 */}
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="mb-4"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        {/* 코드 에디터 */}
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
