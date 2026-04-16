import { config } from '@/lib/config'
import ThemeImages from '@/components/themeImages'

export default function ConfirmationPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-md space-y-6 text-center">
	<ThemeImages />
        <h1
          className="text-3xl font-medium"
          style={{ color: 'var(--color-primary)' }}
        >
          {config.confirmation.title}
        </h1>
        <p style={{ color: 'var(--color-primary)', opacity: 0.6 }}>
          {config.confirmation.message}
        </p>
      </div>
    </main>
  )
}
