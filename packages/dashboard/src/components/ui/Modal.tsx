import type { ReactNode } from 'react'

interface ModalProps {
  children: ReactNode
  className?: string
}

export function Modal({ children, className }: ModalProps) {
  const classes = ['bg-bg-secondary border border-border rounded-xl p-6', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={classes} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}
