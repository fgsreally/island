import type { LocationQuery } from 'vue-router'

export function isExpandedQuery(query: LocationQuery): boolean {
  const q = query.expanded
  if (Array.isArray(q)) return q.includes('1') || q.includes('true')
  return q === '1' || q === 'true'
}

export function stripExpanded(query: LocationQuery): LocationQuery {
  const { expanded: _e, ...rest } = query
  return rest
}
