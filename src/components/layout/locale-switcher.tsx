import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { m } from '@/i18n/paraglide/messages'
import { getLocale, locales, setLocale } from '@/i18n/paraglide/runtime'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function LocaleSwitcher({ className }: Props) {
  const active = getLocale()

  return (
    <ToggleGroup
      spacing={1}
      value={[active]}
      aria-label={m.common_switchLocale()}
      className={cn(
        'border-border bg-muted h-8 gap-0 rounded-lg border p-0.75 md:h-9.5',
        className
      )}
    >
      {locales.map((locale) => (
        <ToggleGroupItem
          key={locale}
          value={locale}
          onClick={() => setLocale(locale)}
          aria-label={m.common_localeName({}, { locale })}
          variant="selected"
          className="h-full flex-1 rounded-md px-2.5 text-xs uppercase md:px-3.5 md:font-semibold"
        >
          {locale}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
