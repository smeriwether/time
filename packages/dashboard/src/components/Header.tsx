interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-bg-secondary border-b border-border px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 logo-gradient rounded-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span className="text-xl font-semibold">DevTime</span>
      </div>
      <nav className="flex gap-6">
        <a href="#" className="text-sm text-text-primary hover:text-text-primary transition-colors">Dashboard</a>
        <button
          onClick={onSettingsClick}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Settings
        </button>
      </nav>
    </header>
  )
}
