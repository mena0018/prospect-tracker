import { Plus, X } from 'lucide-react'

import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  placeholder?: string
  type?: 'text' | 'tel' | 'email'
  addLabel: string
  removeLabel: string
  maxEntries: number
  tabular?: boolean
  className?: string
}

// A repeatable single-line input. The array always holds at least one entry, so the field reads
// as an input rather than as an invisible "add" button — blanks are dropped at the edge.
export function StringListField({
  label,
  placeholder,
  type = 'text',
  addLabel,
  removeLabel,
  maxEntries,
  tabular,
  className
}: Props) {
  const field = useFieldContext<string[]>()
  const entries = field.state.value.length > 0 ? field.state.value : ['']
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  const write = (next: string[]) => field.handleChange(next)

  return (
    <FormField label={label} className={className}>
      <div className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          // Index-keyed on purpose: the rows have no identity of their own, and reordering is
          // not offered — only append and remove.
          <div key={index} className="flex items-center gap-2">
            <Input
              id={index === 0 ? field.name : undefined}
              name={`${field.name}.${index}`}
              type={type}
              value={entry}
              placeholder={placeholder}
              aria-label={`${label} ${index + 1}`}
              aria-invalid={isInvalid}
              onBlur={field.handleBlur}
              onChange={(event) =>
                write(entries.map((value, at) => (at === index ? event.target.value : value)))
              }
              className={cn('h-9', tabular && 'tabular-nums')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={removeLabel}
              // Removing the last row leaves one empty input rather than nothing to type into.
              disabled={entries.length === 1 && entry === ''}
              onClick={() => {
                const next = entries.filter((_, at) => at !== index)
                write(next.length > 0 ? next : [''])
              }}
              className="text-muted-foreground hover:text-destructive flex-none"
            >
              <X />
            </Button>
          </div>
        ))}

        {entries.length < maxEntries ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => write([...entries, ''])}
            className="text-muted-foreground hover:text-foreground h-8 w-fit gap-1.5 px-2 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            {addLabel}
          </Button>
        ) : null}
      </div>
    </FormField>
  )
}
