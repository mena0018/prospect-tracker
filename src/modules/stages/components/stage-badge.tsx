import { Badge } from '@/components/ui/badge'
import { stageColorVar } from '@/modules/stages/stages-utils'

type Props = {
  name: string
  color: string
}

export function StageBadge({ name, color }: Props) {
  return (
    <Badge variant="secondary" className="text-muted-foreground gap-1.75 rounded-full px-2.25">
      <span
        className="size-1.5 flex-none rounded-full"
        style={{ backgroundColor: stageColorVar(color) }}
      />
      {name}
    </Badge>
  )
}
