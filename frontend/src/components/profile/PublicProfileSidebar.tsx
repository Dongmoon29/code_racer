import React from 'react';
import Image from 'next/image';
import {
  MapPin,
  Calendar,
  Star,
  Code,
  Github,
  Linkedin,
  Globe,
} from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: string;
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
  created_at: string;
  rating?: number;
}

interface PublicProfileSidebarProps {
  user: UserInfo;
}

const PublicProfileSidebar: React.FC<PublicProfileSidebarProps> = ({
  user,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0">
      <div className="flex flex-col gap-4">
        {/* Profile Image and Basic Info */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden mb-4 flex items-center justify-center">
            {user?.profile_image ? (
              <Image
                src={user.profile_image}
                alt="Profile"
                width={256}
                height={256}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl lg:text-6xl font-semibold ">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-4 text-center">
            {user?.name}
          </h1>
        </div>

        {/* Location */}
        {user?.company && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{user.company}</span>
          </div>
        )}

        {/* Job Title */}
        {user?.job_title && (
          <div className="text-sm text-muted-foreground">{user.job_title}</div>
        )}

        {/* Rating */}
        {user?.rating && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-foreground">{user.rating}</span>
            <span>rating</span>
          </div>
        )}

        {/* Favorite Language */}
        {user?.fav_language && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Code className="w-4 h-4" />
            <span>Favorite Language</span>
            <span className="font-semibold text-foreground">
              {user.fav_language}
            </span>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Joined{' '}
            {new Date(user?.created_at || '').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </span>
        </div>

        {/* Social Links */}
        {user?.github && (
          <a
            href={user.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:underline break-all"
          >
            <Github className="w-4 h-4" />
            <span>{user.github}</span>
          </a>
        )}
        {user?.linkedin && (
          <a
            href={user.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:underline break-all"
          >
            <Linkedin className="w-4 h-4" />
            <span>{user.linkedin}</span>
          </a>
        )}
        {user?.homepage && (
          <a
            href={user.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:underline break-all"
          >
            <Globe className="w-4 h-4" />
            <span>{user.homepage}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default PublicProfileSidebar;
