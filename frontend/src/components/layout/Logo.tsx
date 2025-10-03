'use client';

import React, { FC } from 'react';
import Image from 'next/image';

const Logo: FC = () => {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={40}
      height={30}
      className="object-contain"
      priority
    />
  );
};

export default Logo;
