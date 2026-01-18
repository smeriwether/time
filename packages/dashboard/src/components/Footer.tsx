export function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-text-secondary">
      <p>
        DevTime is open source.{' '}
        <a
          href="https://github.com/devtime/devtime"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-blue hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          View on GitHub
        </a>
      </p>
    </footer>
  )
}
