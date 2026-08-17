import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  placeholder?: string
  type?: 'text' | 'date' | 'url' | 'tel' | 'email'
  inputMode?: 'numeric'
  autoComplete?: string
  required?: boolean
  hint?: string
  suffix?: string
  tabular?: boolean
  size?: 'default' | 'form'
  labelSuffix?: React.ReactNode
  onBlurValue?: (value: string) => void
  className?: string
}

export function TextInputField({
  label,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  required,
  hint,
  suffix,
  tabular,
  size = 'default',
  labelSuffix,
  onBlurValue,
  className
}: Props) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  const control = {
    id: field.name,
    name: field.name,
    type,
    inputMode,
    autoComplete,
    value: field.state.value,
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      field.handleBlur()
      onBlurValue?.(event.target.value)
    },
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      field.handleChange(event.target.value),
    'aria-invalid': isInvalid,
    'aria-required': required || undefined,
    placeholder
  }

  return (
    <FormField
      label={label}
      required={required}
      hint={hint}
      labelSuffix={labelSuffix}
      className={className}
    >
      {suffix ? (
        <InputGroup className="bg-secondary dark:bg-input/30 h-8.75 rounded-[9px]">
          <InputGroupInput
            {...control}
            size={size}
            className={cn('ps-2.75!', tabular && 'tabular-nums')}
          />
          <InputGroupAddon align="inline-end" className="pr-2.75">
            <InputGroupText className="text-xs">{suffix}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <Input {...control} size={size} className={cn(tabular && 'tabular-nums')} />
      )}
    </FormField>
  )
}
