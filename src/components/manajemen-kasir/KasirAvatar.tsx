import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
]

export function KasirAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const colorClass = AVATAR_COLORS[profile.full_name.charCodeAt(0) % AVATAR_COLORS.length]
  const sizeClass =
    size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs'
  
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name}
        className={`${sizeClass} rounded-xl object-cover ring-2 ring-white shadow-sm`}
      />
    )
  }
  
  return (
    <div
      className={`${sizeClass} rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white flex-shrink-0`}
    >
      {getInitials(profile.full_name)}
    </div>
  )
}
