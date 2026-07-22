import { GoogleIcon } from '@/components/icons/google'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

type Props = {
  pending: boolean
  onClick: () => void
}

export function OAuthSection({ pending, onClick }: Props) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Ou continuer avec
        </span>
        <Separator className="flex-1" />
      </div>

      <Button type="button" variant="outline" onClick={onClick} disabled={pending}>
        {pending ? <Spinner /> : <GoogleIcon />}
        Continuer avec Google
      </Button>
    </>
  )
}
