import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">ProspectTracker</h1>
      <p className="text-muted-foreground">
        Le tracker de prospection orienté action pour freelances dev.
      </p>
    </main>
  )
}
