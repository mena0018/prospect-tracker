import * as React from 'react'

import { cn } from '@/lib/utils'

type Props = React.ComponentProps<'textarea'>

function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-secondary placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-[9px] border px-2.75 py-2.5 text-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
