import { useReducedMotion } from 'motion/react'

// Particle geometry and colours come from the design handoff — see docs/reference/kpis.md
const PARTICLE_COUNT = 14
const ARC_START = -152
const ARC_SWEEP = 124
const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#34d399', '#fbbf24']

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
  const angle = ((ARC_START + (index / (PARTICLE_COUNT - 1)) * ARC_SWEEP) * Math.PI) / 180
  const distance = 30 + (index % 5) * 10
  const isRound = index % 3 !== 0

  return {
    isRound,
    color: COLORS[index % COLORS.length],
    tx: `${(Math.cos(angle) * distance).toFixed(1)}px`,
    ty: `${(Math.sin(angle) * distance).toFixed(1)}px`,
    rot: `${index * 53}deg`,
    delay: `${index * 16}ms`
  }
})

export function FollowUpBurst() {
  if (useReducedMotion()) return null

  return (
    <span className="pointer-events-none absolute top-1/2 left-1/2 z-5 size-0">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="absolute top-0 left-0"
          style={{
            width: particle.isRound ? '5px' : '4px',
            height: particle.isRound ? '5px' : '8px',
            borderRadius: particle.isRound ? '50%' : '1.5px',
            background: particle.color,
            ['--tx' as string]: particle.tx,
            ['--ty' as string]: particle.ty,
            ['--rot' as string]: particle.rot,
            animation: 'follow-up-fly 0.95s cubic-bezier(0.2, 0.7, 0.3, 1) forwards',
            animationDelay: particle.delay
          }}
        />
      ))}
    </span>
  )
}
