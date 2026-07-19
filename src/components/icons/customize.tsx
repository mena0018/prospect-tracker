export function CustomizeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <line x1="4" y1="8" x2="14" y2="8" />
      <line x1="18" y1="8" x2="20" y2="8" />
      <circle cx="16" cy="8" r="2" />
      <line x1="4" y1="16" x2="6" y2="16" />
      <line x1="10" y1="16" x2="20" y2="16" />
      <circle cx="8" cy="16" r="2" />
    </svg>
  )
}
