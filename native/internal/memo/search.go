package memo

import "strings"

// MatchesQuery reports whether a memo matches a lightweight quick-find query.
// Matching is case-insensitive and searches memo content plus labels.
func (m Memo) MatchesQuery(query string) bool {
	query = strings.ToLower(strings.TrimSpace(query))
	if query == "" {
		return true
	}
	if strings.Contains(strings.ToLower(m.Content), query) {
		return true
	}
	for _, label := range m.Labels {
		if strings.Contains(strings.ToLower(label), query) {
			return true
		}
	}
	return false
}
