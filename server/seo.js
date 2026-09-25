// Build-time SEO: fills <!--SEO_INJECT--> in index.html and emits robots.txt + sitemap.xml.
// Set SITE_URL in .env (e.g. SITE_URL=https://testprep.vercel.app) for absolute URLs,
// canonical tags and the sitemap. Without it, only relative tags are written.
import fs from 'node:fs'
import path from 'node:path'

const OG_IMAGE = '/images/og-image.png'
const PRIVATE_PATHS = ['/result/', '/summary']

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function readMaster(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'public/data/master.json'), 'utf8')) }
  catch { return {} }
}

function jsonLd(master, site) {
  const app = master.app || {}
  const f   = app.founder || {}
  const abs = (p) => (site && p ? site + p : p)

  const org = {
    '@type': 'EducationalOrganization',
    '@id': site ? `${site}/#org` : undefined,
    name: app.name || 'TestPrep',
    url: site || undefined,
    logo: abs('/images/icon-512.png'),
    description: f.vision || app.tagline,
    email: f.email,
    telephone: f.phone,
    founder: f.name ? {
      '@type': 'Person',
      name: f.name,
      jobTitle: 'Founder',
      image: abs(f.photo),
      sameAs: f.portfolio ? [f.portfolio] : undefined,
    } : undefined,
  }

  const website = {
    '@type': 'WebSite',
    '@id': site ? `${site}/#website` : undefined,
    name: app.name || 'TestPrep',
    url: site || undefined,
    inLanguage: ['en-IN', 'hi-IN'],
    publisher: site ? { '@id': `${site}/#org` } : undefined,
  }

  // One Course entry per active exam, listing its free tests
  const courses = (master.courses || []).filter(c => c.active).map(c => ({
    '@type': 'Course',
    name: c.title,
    description: c.description,
    url: site ? `${site}/course/${c.id}` : undefined,
    inLanguage: ['hi-IN', 'en-IN'],
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: app.name || 'TestPrep', sameAs: site || undefined },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR', category: 'Free' },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
  }))

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, website, ...courses] })
}

export function seoPlugin(env, root = process.cwd()) {
  const site = (env.SITE_URL || '').replace(/\/+$/, '')

  return {
    name: 'seo',

    transformIndexHtml(html) {
      const master = readMaster(root)
      const img = site ? site + OG_IMAGE : OG_IMAGE
      const tags = [
        site && `<link rel="canonical" href="${esc(site)}/" />`,
        site && `<meta property="og:url" content="${esc(site)}/" />`,
        `<meta property="og:image" content="${esc(img)}" />`,
        `<meta name="twitter:image" content="${esc(img)}" />`,
        `<script type="application/ld+json">${jsonLd(master, site).replace(/</g, '\\u003c')}</script>`,
      ].filter(Boolean).join('\n    ')
      return html
        .replace('<!--SEO_INJECT-->', tags)
        .replaceAll('__APP_NAME__', esc(master.app?.name || 'TestPrep'))
    },

    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /',
        ...PRIVATE_PATHS.map(p => `Disallow: ${p}`),
        'Disallow: /api/',
        site && `\nSitemap: ${site}/sitemap.xml`,
      ].filter(Boolean).join('\n') + '\n'
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })

      if (!site) return
      const master = readMaster(root)
      const today = new Date().toISOString().slice(0, 10)
      const urls = [{ loc: `${site}/`, priority: '1.0', lastmod: today }]
      for (const c of master.courses || []) {
        if (!c.active) continue
        const dates = (c.testSeries || []).map(t => t.datePublished).filter(Boolean).sort()
        urls.push({ loc: `${site}/course/${c.id}`, priority: '0.9', lastmod: dates.at(-1) || today })
        for (const t of c.testSeries || []) {
          if (t.isFree) urls.push({ loc: `${site}/quiz/${t.id}`, priority: '0.7', lastmod: t.datePublished || today })
        }
      }
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n') +
        '\n</urlset>\n'
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
    },
  }
}
