import { useState, useEffect, useCallback } from 'react'
import { fetchJson } from '../utils/fetchJson'

let masterCache   = null
let masterPromise = null

// Share one request between all components that mount at the same time
function loadMaster() {
  if (!masterPromise) {
    masterPromise = fetchJson('/data/master.json')
      .then(d => { masterCache = d; return d })
      .catch(e => { masterPromise = null; throw e })
  }
  return masterPromise
}

export function useMaster() {
  const [master, setMaster] = useState(masterCache)
  const [loading, setLoading] = useState(!masterCache)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (masterCache) return
    let alive = true
    loadMaster()
      .then(d => { if (alive) { setMaster(d); setLoading(false) } })
      .catch(e => { if (alive) { setError(e.message); setLoading(false) } })
    return () => { alive = false }
  }, [])

  const getCourse = useCallback(
    (id) => master?.courses?.find(c => c.id === id) || null,
    [master]
  )

  const getTest = useCallback((id) => {
    for (const c of master?.courses || []) {
      const t = c.testSeries?.find(t => t.id === id)
      if (t) return { test: t, course: c }
    }
    return null
  }, [master])

  return { master, loading, error, getCourse, getTest }
}
