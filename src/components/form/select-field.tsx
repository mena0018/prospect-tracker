import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type Option = { id: string; name: string }

type Props = {
  label: string
  options: Option[]
  placeholder: string
  clearLabel?: string
  required?: boolean
  hint?: string
  className?: string
}

export function SelectField({
  label,
  options,
  placeholder,
  clearLabel,
  required,
  hint,
  className
}: Props) {
  const field = useFieldContext<string | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <FormField label={label} required={required} hint={hint} className={className}>
      <Select
        name={field.name}
        value={field.state.value}
        onValueChange={(next: string | null) => {
          field.handleChange(next)
          field.handleBlur()
        }}
      >
        <SelectTrigger
          size="form"
          id={field.name}
          aria-invalid={isInvalid}
          aria-required={required || undefined}
          className="w-full"
        >
          <SelectValue placeholder={placeholder}>
            {(selected: string | null) =>
              options.find((option) => option.id === selected)?.name ?? placeholder
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {clearLabel ? (
            <SelectItem value={null} className="text-muted-foreground">
              {clearLabel}
            </SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
