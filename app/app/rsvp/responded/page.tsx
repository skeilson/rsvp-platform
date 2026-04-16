import Link from 'next/link'
import { config } from '@/lib/config'
import ThemeImages from '@/components/themeImages'

export default function AlreadyRespondedPage() {
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
          You have already responded
        </h1>
        <p style={{ color: 'var(--color-primary)', opacity: 0.6 }}>
          We already have your RSVP on file. Please reach out to us directly if you need to make a change.
        </p>
        {config.rsvp.allowChanges && (
          <Link
            href="/rsvp"
            className="inline-block text-sm underline underline-offset-4"
            style={{ color: 'var(--color-primary)', opacity: 0.5 }}
          >
            Update my RSVP
          </Link>
        )}
      </div>
    </main>
  )
}
