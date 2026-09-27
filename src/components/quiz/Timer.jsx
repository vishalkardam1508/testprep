import { useState, useEffect, useRef } from 'react'

// endTime: timestamp (ms) when the test ends. null = not started yet.
export default function Timer({ endTime, durationMinutes, onExpire }) {
  const totalSecs = durationMinutes * 60
  const remaining = () => endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : totalSecs

  const [secs, setSecs] = useState(remaining)
  const onExpireRef = useRef(onExpire)
  const firedRef    = useRef(false)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  useEffect(() => {
    if (!endTime) { setSecs(totalSecs); return }
    const update = () => setSecs(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)))
    update()
    const id = setInterval(update, 500)
    return () => clearInterval(id)
  }, [endTime, totalSecs])

  useEffect(() => {
    if (endTime && secs === 0 && !firedRef.current) {
      firedRef.current = true
      onExpireRef.current?.()
    }
  }, [secs, endTime])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n) => String(n).padStart(2, '0')
  const isLow = endTime && secs <= 300

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl font-mono font-bold text-sm sm:text-base tabular-nums whitespace-nowrap transition-all ${
      isLow ? 'bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse' : 'bg-gray-800 text-white'
    }`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {h > 0 && `${h}:`}{pad(m)}:{pad(s)}
    </div>
  )
}
