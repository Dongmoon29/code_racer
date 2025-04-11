import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

const Contributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/Dongmoon29/code_racer/contributors'
        );
        const data = await response.json();
        setContributors(data);
      } catch (error) {
        console.error('Failed to fetch contributors:', error);
      }
    };

    fetchContributors();
  }, []);

  return (
    <div className="flex flex-col items-center mt-4">
      <h3 className="text-sm font-medium mb-2 text-gray-500">
        Made with ❤️ by these awesome contributors
      </h3>
      <div className="flex flex-wrap justify-center gap-2">
        {contributors.map((contributor) => (
          <a
            key={contributor.login}
            href={contributor.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
          >
            <Image
              src={contributor.avatar_url}
              alt={`${contributor.login}'s avatar`}
              width={32}
              height={32}
              className="rounded-full transition-transform group-hover:scale-110"
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {contributor.login}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Contributors;
