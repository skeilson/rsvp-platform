export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      color: '#111111',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
    }}>
      {children}
    </div>
  )
}
