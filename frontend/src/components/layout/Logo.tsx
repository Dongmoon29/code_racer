'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Logo: FC = () => {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/logo.png"
        alt="Logo"
        width={40}
        height={30}
        className="object-contain"
        priority
      />
    </Link>
  );
};

export default Logo;
