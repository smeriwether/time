import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md'
}

export function Panel({ children, className, padding = 'md' }: PanelProps) {
  const paddingClass = padding === 'sm' ? 'p-5' : 'p-6'
  const classes = ['bg-bg-secondary border border-border rounded-xl', paddingClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}
