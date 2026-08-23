import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { STAGE_COLOR_TOKENS, type StageColorToken } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'

type Props = {
  color: string
  onSelect: (color: StageColorToken) => void
}

export function StageColorPicker({ color, onSelect }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="md"
            aria-label={m.customize_stageColorChange()}
            className="flex-none gap-2 px-2.5"
          />
        }
      >
        <StageDot
          size="md"
          style={{ '--stage-dot': stageColorVar(color) } as React.CSSProperties}
        />
        <ChevronDown className="text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-53.5 p-3">
        <p className="text-muted-foreground tracking-label text-2xs mb-2.5 font-semibold uppercase">
          {m.customize_stageColorTitle()}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {STAGE_COLOR_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              title={token}
              aria-label={token}
              aria-pressed={token === color}
              onClick={() => onSelect(token)}
              style={{ backgroundColor: stageColorVar(token) }}
              className={cn(
                'flex aspect-square cursor-pointer items-center justify-center rounded-lg outline-none',
                'focus-visible:ring-ring/50 focus-visible:ring-3',
                token === color
                  ? 'ring-foreground ring-2'
                  : 'ring-foreground/12 hover:ring-foreground/30 ring-1'
              )}
            >
              {token === color && <Check className="size-3 text-white" strokeWidth={3.4} />}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-2xs mt-2.5">{m.customize_stageColorAvailable()}</p>
      </PopoverContent>
    </Popover>
  )
}
