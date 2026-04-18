import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  }
  return (
    <Loader2
      className={clsx(
        'animate-spin text-teal-400',
        sizes[size],
        className
      )}
    />
  )
}

// Full-page loader
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-primary-subtle">Đang tải...</p>
      </div>
    </div>
  )
}