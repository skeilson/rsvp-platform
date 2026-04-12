import Link from 'next/link'
import { config } from '@/lib/config'

export default function AlreadyRespondedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-medium">You've already responded</h1>
        <p className="text-gray-500">
          We already have your RSVP on file. Please reach out to us directly if you need to make a change.
        </p>
        {config.rsvp.allowChanges && (
          <Link
            href="/rsvp"
            className="inline-block text-sm text-gray-400 underline underline-offset-4"
          >
            Update my RSVP
          </Link>
        )}
      </div>
    </main>
  )
}
