/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Styled Components SSR 설정
  compiler: {
    styledComponents: {
      displayName: true,
      ssr: true,
      fileName: true,
      meaninglessFileNames: ['index', 'styles'],
      minify: true,
      transpileTemplateLiterals: true,
      pure: false,
    },
  },
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com', // Google 프로필 이미지 도메인 추가
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
        }/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
