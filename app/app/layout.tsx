import type { Metadata } from 'next'
import { Inter, Playfair_Display, Lato, Montserrat, Raleway, Merriweather } from 'next/font/google'
import './globals.css'
import { createClient } from '@supabase/supabase-js'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' })
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' })

export const metadata: Metadata = {
  title: 'RSVP',
  description: 'RSVP for our event',
}

const THEME_ID = '00000000-0000-0000-0000-000000000001'

const fontMap: Record<string, string> = {
  Inter: 'var(--font-inter)',
  'Playfair Display': 'var(--font-playfair)',
  Lato: 'var(--font-lato)',
  Montserrat: 'var(--font-montserrat)',
  Raleway: 'var(--font-raleway)',
  Merriweather: 'var(--font-merriweather)',
}

async function getTheme() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data } = await supabase
      .from('theme')
      .select('*')
      .eq('id', THEME_ID)
      .single()

    return data
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = await getTheme()

  const primaryColor = theme?.primary_color ?? '#111111'
  const backgroundColor = theme?.background_color ?? '#ffffff'
  const accentColor = theme?.accent_color ?? '#6366f1'
  const fontFamily = theme?.font_family ?? 'Inter'
  const fontVar = fontMap[fontFamily] ?? 'var(--font-inter)'

  const cssVars = `
    :root {
      --color-primary: ${primaryColor};
      --color-background: ${backgroundColor};
      --color-accent: ${accentColor};
      --font-theme: ${fontVar};
    }
    body:not(.admin-page) {
      background-color: var(--color-background);
      font-family: var(--font-theme), sans-serif;
    }
  `

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${lato.variable} ${montserrat.variable} ${raleway.variable} ${merriweather.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
