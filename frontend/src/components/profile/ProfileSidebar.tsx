import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { MapPin, Calendar, Star } from 'lucide-react';
import ProfileEditForm, { LanguageOption } from './ProfileEditForm';

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

interface ProfileSidebarProps {
  user: UserInfo;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ user }) => {
  const [showEdit, setShowEdit] = useState(false);
  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0">
      {/* Profile Image and Basic Info */}
      <div className="flex flex-col items-center mb-6">
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

        <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-1 text-center">
          {user?.name}
        </h1>
        <p className="text-base lg:text-lg text-muted-foreground mb-4 text-center">
          {user?.email}
        </p>

        <Button className="w-full mb-4" onClick={() => setShowEdit((v) => !v)}>
          Edit profile
        </Button>
      </div>

      {showEdit && (
        <div className="mb-6">
          <ProfileEditForm
            initial={{
              homepage: user?.homepage,
              linkedin: user?.linkedin,
              github: user?.github,
              company: user?.company,
              job_title: user?.job_title,
              fav_language: (user?.fav_language as LanguageOption) || '',
            }}
            onSaved={() => setShowEdit(false)}
          />
        </div>
      )}

      {/* Location */}
      {user?.company && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{user.company}</span>
          </div>
        </div>
      )}

      {/* Job Title */}
      {user?.job_title && (
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">{user.job_title}</div>
        </div>
      )}

      {/* Rating */}
      {user?.rating && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-foreground">{user.rating}</span>
            <span>rating</span>
          </div>
        </div>
      )}

      {/* Member Since */}
      <div className="mb-6">
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
      </div>

      {/* Social Links */}
      <div className="space-y-2">
        {user?.github && (
          <a
            href={user.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
          >
            <span>GitHub</span>
          </a>
        )}
        {user?.linkedin && (
          <a
            href={user.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
          >
            <span>LinkedIn</span>
          </a>
        )}
        {user?.homepage && (
          <a
            href={user.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
          >
            <span>Homepage</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;
