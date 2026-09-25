// Full class names so Tailwind keeps them in the build
const SECTION_COLORS = {
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/15',  border: 'border-violet-500',  dot: 'bg-violet-500'  },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500',    dot: 'bg-cyan-500'    },
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500',    dot: 'bg-blue-500'    },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500', dot: 'bg-emerald-500' },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500',  dot: 'bg-orange-500'  },
  pink:    { text: 'text-pink-400',    bg: 'bg-pink-500/15',    border: 'border-pink-500',    dot: 'bg-pink-500'    },
  yellow:  { text: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500',  dot: 'bg-yellow-500'  },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500',     dot: 'bg-red-500'     },
  gray:    { text: 'text-gray-400',    bg: 'bg-gray-500/15',    border: 'border-gray-500',    dot: 'bg-gray-500'    },
}

export const sectionColor = (color) => SECTION_COLORS[color] || SECTION_COLORS.gray

// Groups items (questions or result details, anything with `.section`) in the
// order sections are declared. Items with an unknown section go last.
// Returns [{ id, title, color, items: [{ q, index }] }] — index is the position
// in the flattened, section-ordered list (used for numbering and navigation).
export function groupBySection(items, sections = []) {
  const known  = new Map(sections.map(s => [s.id, s]))
  const groups = new Map()

  const get = (id) => {
    const key = id ?? '_none'
    if (!groups.has(key)) {
      const s = known.get(id)
      groups.set(key, {
        id: key,
        title: s?.title || (id ? id : 'Questions'),
        color: s?.color || 'gray',
        items: [],
      })
    }
    return groups.get(key)
  }

  sections.forEach(s => get(s.id))
  items.forEach(q => get(q.section).items.push({ q }))

  let index = 0
  return [...groups.values()]
    .filter(g => g.items.length > 0)
    .map(g => ({ ...g, items: g.items.map(({ q }) => ({ q, index: index++ })) }))
}

export const orderBySection = (items, sections) =>
  groupBySection(items, sections).flatMap(g => g.items.map(i => i.q))
