import { useId } from 'react'

export function BrandMark(props: React.ComponentProps<'svg'>) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id={gradientId}
          x1="47.44"
          y1="31.45"
          x2="32"
          y2="17.3"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="1" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M47.44 31.45A15.5 15.5 0 1 1 32 17.3"
        stroke={`url(#${gradientId})`}
        strokeWidth="7.75"
        strokeLinecap="round"
      />
      <path d="M32 10.74 41.54 17.3 32 23.86z" fill="currentColor" />
      <circle cx="32" cy="32.8" r="4.77" fill="currentColor" />
    </svg>
  )
}
