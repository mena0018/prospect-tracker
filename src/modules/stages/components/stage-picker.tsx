import { Radio } from '@base-ui/react/radio'

import type { Stage } from '@/db/schema'
import { RadioGroup } from '@/components/ui/radio-group'
import { StageBadge } from '@/modules/stages/components/stage-badge'

type Props = Omit<React.ComponentProps<typeof RadioGroup>, 'onChange'> & {
  stages: Stage[]
}

export function StagePicker({ stages, ...props }: Props) {
  return (
    <RadioGroup {...props} className="flex w-full flex-row flex-wrap gap-1.75">
      {stages.map((stage) => (
        <Radio.Root
          nativeButton
          key={stage.id}
          value={stage.id}
          render={<StageBadge withInteraction name={stage.name} color={stage.color} />}
        />
      ))}
    </RadioGroup>
  )
}
