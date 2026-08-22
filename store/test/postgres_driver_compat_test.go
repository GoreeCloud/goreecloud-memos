package test

import (
	"database/sql"
	"testing"

	"github.com/jackc/pgx/v5/stdlib"
	"github.com/stretchr/testify/require"
)

// The migration fixture matrix intentionally keeps DRIVER=postgres because that
// value selects PostgreSQL SQL dialects and container behavior throughout the
// shared tests. Register pgx under the historical database/sql test alias so
// legacy fixtures that call sql.Open("postgres", ...) exercise the hardened pgx
// adapter without reintroducing lib/pq.
func init() {
	sql.Register("postgres", stdlib.GetDefaultDriver())
}

func TestPostgresDriverCompatibilityAlias(t *testing.T) {
	t.Parallel()
	require.Contains(t, sql.Drivers(), "postgres")
	require.Contains(t, sql.Drivers(), "pgx")
}
