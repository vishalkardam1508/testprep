import { useState } from 'react'

// Fixed-height image banner for the top of a card.
// The full image is always visible (object-contain); a blurred copy of the same
// image fills the leftover space. Without an image (or if it fails to load) the
// colour gradient with the title's first letter is shown, so every card keeps
// the same height. `children` are overlaid in the top corners (badges).
export default function CardBanner({ src, alt = '', color, children, height = 'h-40' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImg = src && failedSrc !== src

  return (
    <div className={`relative ${height} flex-shrink-0 overflow-hidden bg-gradient-to-br ${color || 'from-violet-600 to-purple-700'}`}>
      {showImg ? (
        <>
          {/* Blurred fill behind */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60"
          />
          {/* Full image, never cropped */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(src)}
            className="relative w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl font-black text-white/20 select-none">{alt?.[0]}</span>
        </div>
      )}

      {children && (
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
