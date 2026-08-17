import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group'
import { m } from '@/i18n/paraglide/messages'

type Props = {
  label: string
  autoComplete: 'current-password' | 'new-password'
  labelSuffix?: React.ReactNode
  shown?: boolean
  onToggle?: () => void
  className?: string
}

export function PasswordField({
  label,
  autoComplete,
  labelSuffix,
  shown,
  onToggle,
  className
}: Props) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  const [ownShown, setOwnShown] = useState(false)
  const displayedShown = shown ?? ownShown
  const toggle = onToggle ?? (() => setOwnShown((current) => !current))

  return (
    <FormField label={label} labelSuffix={labelSuffix} className={className}>
      <InputGroup className="h-11">
        <InputGroupInput
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          aria-invalid={isInvalid}
          type={displayedShown ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            tabIndex={-1}
            title={m.auth_togglePassword()}
            aria-label={displayedShown ? m.auth_hidePassword() : m.auth_showPassword()}
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {displayedShown ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FormField>
  )
}
