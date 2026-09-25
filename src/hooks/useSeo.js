import { useEffect } from 'react'

// App name comes from master.json app.name (written into index.html at build time)
const SITE_NAME = (typeof document !== 'undefined' &&
  document.querySelector('meta[name="application-name"]')?.content) || 'TestPrep'

// Defaults come from index.html, captured once before any page changes them
const initial = typeof document !== 'undefined' ? {
  title:       document.title,
  description: document.querySelector('meta[name="description"]')?.content || '',
  image:       document.querySelector('meta[property="og:image"]')?.content || '/images/og-image.png',
} : {}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Keep descriptions within what Google shows (~160 chars)
const clip = (s, n = 160) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/**
 * Per-page SEO. Call once at the top of a page component.
 *   useSeo({ title: 'Super TET 2026', description: '...', image: '/images/x.jpg' })
 *   useSeo({ title: 'My Results', noindex: true })
 * Pass `title: null` while data is loading to keep the current tags.
 */
export function useSeo({ title, description, image, noindex = false, type = 'website' } = {}) {
  useEffect(() => {
    if (title === null) return

    const fullTitle = title ? `${title} | ${SITE_NAME}` : initial.title
    const desc      = clip(description || initial.description)
    const origin    = window.location.origin
    const url       = origin + window.location.pathname
    const img       = new URL(image || initial.image, origin).href

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    setCanonical(url)

    setMeta('property', 'og:type', type)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)

    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', img)
  }, [title, description, image, noindex, type])
}
