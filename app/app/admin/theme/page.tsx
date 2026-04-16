'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Theme = {
  primary_color: string
  background_color: string
  accent_color: string
  font_family: string
  logo_url: string
  hero_url: string
}

const FONTS = [
  'Inter',
  'Playfair Display',
  'Lato',
  'Montserrat',
  'Raleway',
  'Merriweather',
]

const defaultTheme: Theme = {
  primary_color: '#111111',
  background_color: '#ffffff',
  accent_color: '#6366f1',
  font_family: 'Inter',
  logo_url: '',
  hero_url: '',
}

export default function ThemeEditorPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchTheme() {
      const response = await fetch('/api/theme')
      const data = await response.json()
      if (data) {
        setTheme({
          primary_color: data.primary_color ?? defaultTheme.primary_color,
          background_color: data.background_color ?? defaultTheme.background_color,
          accent_color: data.accent_color ?? defaultTheme.accent_color,
          font_family: data.font_family ?? defaultTheme.font_family,
          logo_url: data.logo_url ?? '',
          hero_url: data.hero_url ?? '',
        })
      }
      setLoading(false)
    }
    fetchTheme()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function update(field: keyof Theme, value: string) {
    setTheme(prev => ({ ...prev, [field]: value }))
  }

  async function handleUpload(file: File, field: 'logo_url' | 'hero_url') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', field === 'logo_url' ? 'logos' : 'heroes')

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    if (result.url) {
      update(field, result.url)
    }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading theme...</p>
    </main>
  )

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-medium">Theme editor</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-gray-400 underline underline-offset-4"
            >
              Back to dashboard
            </button>
            <a href="/api/admin/logout"
              className="text-sm text-gray-400 underline underline-offset-4"
            >
              Sign out
            </a>
          </div>
        </div>

        {/* Colors */}
        <div className="border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-medium">Colors</h2>

          <div className="space-y-4">
            {[
              { label: 'Primary color', field: 'primary_color' as keyof Theme, hint: 'Used for buttons and key UI elements' },
              { label: 'Background color', field: 'background_color' as keyof Theme, hint: 'Main page background' },
              { label: 'Accent color', field: 'accent_color' as keyof Theme, hint: 'Used for highlights and focus states' },
            ].map(({ label, field, hint }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme[field]}
                    onChange={e => update(field, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={theme[field]}
                    onChange={e => update(field, e.target.value)}
                    className="w-28 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Font */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-medium">Font</h2>
          <div className="grid grid-cols-2 gap-3">
            {FONTS.map(font => (
              <button
                key={font}
                onClick={() => update('font_family', font)}
                className={`py-3 px-4 rounded-lg border text-left text-sm ${
                  theme.font_family === font
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300'
                }`}
                style={{ fontFamily: font }}
              >
                {font}
                <span className="block text-xs opacity-60 mt-0.5">
                  The quick brown fox
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-medium">Images</h2>
          <p className="text-sm text-gray-500">
            Upload an image or paste a public URL.
          </p>

         <div className="space-y-4">
            <div className="space-y-2">
      	    <p className="text-sm font-medium">Logo or monogram</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={theme.logo_url}
                  onChange={e => update('logo_url', e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <label className="px-4 py-3 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, 'logo_url')
                    }}
                  />
                </label>
              </div>
              {theme.logo_url && (
                <img
                  src={theme.logo_url}
                  alt="Logo preview"
                  className="h-16 object-contain rounded"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Hero image</p>
              <div className="flex gap-2">
                <input
                  type="text"
               	  placeholder="https://example.com/hero.jpg"
         	  value={theme.hero_url}
         	  onChange={e => update('hero_url', e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <label className="px-4 py-3 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, 'hero_url')
                    }}
                  />
                </label>
              </div>
              {theme.hero_url && (
                <img
                  src={theme.hero_url}
                  alt="Hero preview"
                  className="w-full h-40 object-cover rounded-lg"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-medium">Preview</h2>
          <div
            className="rounded-lg p-8 space-y-4 border"
            style={{
              backgroundColor: theme.background_color,
              fontFamily: theme.font_family,
            }}
          >
            {theme.logo_url && (
              <img
                src={theme.logo_url}
                alt="Logo"
                className="h-12 object-contain"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
            {theme.hero_url && (
              <img
                src={theme.hero_url}
                alt="Hero"
                className="w-full h-32 object-cover rounded"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
            <h3
              className="text-2xl font-medium"
              style={{ color: theme.primary_color, fontFamily: theme.font_family }}
            >
              RSVP
            </h3>
            <p style={{ color: theme.primary_color, opacity: 0.6, fontFamily: theme.font_family }}>
              Enter your name as it appears on your invitation
            </p>
            <button
              className="px-6 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: theme.primary_color, color: theme.background_color }}
            >
              Find my invitation
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save theme'}
        </button>

      </div>
    </main>
  )
}
