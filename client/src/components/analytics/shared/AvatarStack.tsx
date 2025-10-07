import React from 'react';
import { colors } from '../../../styles/designTokens';

interface Avatar {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
}

interface AvatarStackProps {
  avatars: Avatar[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AvatarStack: React.FC<AvatarStackProps> = ({
  avatars,
  maxVisible = 4,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = Math.max(0, avatars.length - maxVisible);

  const getInitials = (name: string) => {
    return (name || 'U')
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-1">
        {visibleAvatars.map((avatar, index) => (
          <div
            key={avatar.id}
            className={`
              ${sizeClasses[size]}
              rounded-full border-2 border-white flex items-center justify-center
              bg-gray-100 text-gray-600 font-medium
              relative z-10
            `}
            style={{
              zIndex: maxVisible - index,
              borderColor: colors.cardBg
            }}
            title={avatar.name}
          >
            {avatar.avatarUrl ? (
              <img
                src={avatar.avatarUrl}
                alt={avatar.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{avatar.initials || getInitials(avatar.name)}</span>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={`
              ${sizeClasses[size]}
              rounded-full border-2 border-white flex items-center justify-center
              bg-gray-200 text-gray-600 font-medium text-xs
            `}
            style={{
              borderColor: colors.cardBg,
              zIndex: 0
            }}
            title={`+${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarStack;
