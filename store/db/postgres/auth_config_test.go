package postgres

import (
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/require"
)

func TestIsRetryableAuthenticationMutationError(t *testing.T) {
	db := &DB{}
	require.True(t, db.IsRetryableAuthenticationMutationError(errors.Wrap(&pgconn.PgError{Code: "40001"}, "commit failed")))
	require.True(t, db.IsRetryableAuthenticationMutationError(&pgconn.PgError{Code: "40P01"}))
	require.False(t, db.IsRetryableAuthenticationMutationError(&pgconn.PgError{Code: "23505"}))
}
