import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { useFieldContext } from '@/components/form/form-context'
import { cn } from '@/lib/utils'
import { Asterisk } from 'lucide-react'

type Props = {
  label: string
  required?: boolean
  className?: string
  hint?: string
  hintClassName?: string
  labelSuffix?: React.ReactNode
  children: React.ReactNode
}

export function FormField({
  label,
  required,
  hint,
  hintClassName,
  labelSuffix,
  className,
  children
}: Props) {
  const field = useFieldContext<unknown>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid} className={cn('gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={field.name} className="gap-0.5">
          {label}
          {required ? <Asterisk size={9} className="text-destructive mb-1" /> : null}
        </FieldLabel>
        {labelSuffix ? <span className="flex-none">{labelSuffix}</span> : null}
      </div>

      {children}

      {isInvalid ? (
        <FieldError errors={field.state.meta.errors} />
      ) : hint ? (
        <FieldDescription className={cn('text-muted-foreground text-2xs', hintClassName)}>
          {hint}
        </FieldDescription>
      ) : null}
    </Field>
  )
}
