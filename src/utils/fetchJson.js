export async function fetchJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to load ${url} (HTTP ${r.status})`)
  return r.json()
}
