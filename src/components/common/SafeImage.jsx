import { useState } from 'react'

// Renders `fallback` when there is no src or the image fails to load (broken link, blocked hotlink, etc.)
export default function SafeImage({ src, alt = '', className = '', fallback = null }) {
  const [failedSrc, setFailedSrc] = useState(null)
  if (!src || failedSrc === src) return fallback
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  )
}
