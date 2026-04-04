import Link from 'next/link'

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-medium">You're all set</h1>
        <p className="text-gray-500">
          Thank you for your RSVP. We look forward to celebrating with you.
        </p>
        <Link
          href="/rsvp"
          className="inline-block text-sm text-gray-400 underline underline-offset-4"
        >
          Need to make a change? Start over
        </Link>
      </div>
    </main>
  )
}
