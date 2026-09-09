"use client";

import React, { FC } from "react";
import Image from "next/image";

const Logo: FC = () => (
  <Image
    src="/logo.png"
    alt="CodeRacer"
    width={40}
    height={30}
    className="object-contain"
    priority
    sizes="40px"
  />
);

export default Logo;
