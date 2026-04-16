'use client'

import { useEffect, useState } from 'react'

type ThemeImages = {
  logo_url: string | null
  hero_url: string | null
}

export default function ThemeImages() {
  const [images, setImages] = useState<ThemeImages>({ logo_url: null, hero_url: null })

  useEffect(() => {
    async function fetchTheme() {
      const response = await fetch('/api/theme')
      const data = await response.json()
      setImages({
        logo_url: data.logo_url || null,
        hero_url: data.hero_url || null,
      })
    }
    fetchTheme()
  }, [])

  if (!images.logo_url && !images.hero_url) return null

  return (
    <div className="w-full">
      {images.hero_url && (
        <img
          src={images.hero_url}
          alt="Event hero"
          className="w-full h-48 object-cover"
          style={{ display: 'block' }}
        />
      )}
      {images.logo_url && (
        <div className="flex justify-center py-6">
          <img
            src={images.logo_url}
            alt="Event logo"
            className="h-16 object-contain"
          />
        </div>
      )}
    </div>
  )
}
