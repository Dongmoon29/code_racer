import React from 'react';
import {
  Calendar,
  Building,
  Briefcase,
  Code,
  Globe,
  Github,
  Linkedin,
  Star,
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

interface OverviewProps {
  user: UserInfo;
}

const Overview: React.FC<OverviewProps> = ({ user }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Overview</h3>

      <div className="space-y-6">
        {/* Basic Information */}
        {user.rating && (
          <div className="flex items-center space-x-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <div>
              <div className="text-sm font-medium">Rating</div>
              <div className="text-sm text-muted-foreground">
                {user.rating} points
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Company</div>
                <div className="text-sm text-muted-foreground">
                  {user.company || 'Not specified'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Job Title</div>
                <div className="text-sm text-muted-foreground">
                  {user.job_title || 'Not specified'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Code className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Favorite Language</div>
                <div className="text-sm text-muted-foreground">
                  {user.fav_language || 'Not specified'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Member Since</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {(user.homepage || user.github || user.linkedin) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Social Links</h4>
            <div className="flex flex-wrap gap-3">
              {user.homepage && (
                <a
                  href={user.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span>Homepage</span>
                </a>
              )}
              {user.github && (
                <a
                  href={user.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
              {user.linkedin && (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
