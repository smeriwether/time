import { useState } from 'react'

interface SettingsProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  onClose: () => void
}

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'dt_'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function Settings({ apiKey, onApiKeyChange, onClose }: SettingsProps) {
  const [inputValue, setInputValue] = useState(apiKey)
  const [copied, setCopied] = useState(false)

  const handleSave = () => {
    localStorage.setItem('devtime_api_key', inputValue)
    onApiKeyChange(inputValue)
    onClose()
  }

  const handleGenerate = () => {
    const newKey = generateApiKey()
    setInputValue(newKey)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inputValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isDevKey = inputValue === 'dt_dev_key'
  const isValidFormat = inputValue.startsWith('dt_') && inputValue.length > 10

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">API Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="dt_your_api_key_here"
                className="flex-1 bg-bg-tertiary border border-border rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-accent-blue"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg hover:border-text-secondary transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {isDevKey && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-500">
                Using development key. This only works when the API is running in development mode.
              </p>
            </div>
          )}

          {!isValidFormat && inputValue && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">
                API key must start with "dt_" and be at least 10 characters.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-sm hover:border-text-secondary transition-colors"
            >
              Generate New Key
            </button>
          </div>

          <div className="bg-bg-tertiary/50 border border-border rounded-lg p-3">
            <p className="text-xs text-text-secondary">
              To use a generated key, you'll need to add it to the API's key store. For local development, use <code className="bg-bg-tertiary px-1 rounded">dt_dev_key</code>.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidFormat}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
