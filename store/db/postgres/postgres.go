package postgres

import (
	"context"
	"database/sql"
	"log"

	// Use pgx's database/sql adapter. pgx v5.10 includes explicit hardening
	// against malicious or compromised PostgreSQL servers and replaces lib/pq,
	// which currently has reachable advisories without a fixed release.
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pkg/errors"

	"github.com/usememos/memos/internal/profile"
	"github.com/usememos/memos/store"
)

type DB struct {
	db      *sql.DB
	profile *profile.Profile
}

func NewDB(profile *profile.Profile) (store.Driver, error) {
	if profile == nil {
		return nil, errors.New("profile is nil")
	}

	// Open the PostgreSQL connection through pgx's database/sql adapter.
	db, err := sql.Open("pgx", profile.DSN)
	if err != nil {
		log.Printf("Failed to open database: %s", err)
		return nil, errors.Wrap(err, "failed to open PostgreSQL database")
	}

	var driver store.Driver = &DB{
		db:      db,
		profile: profile,
	}

	return driver, nil
}

func (d *DB) GetDB() *sql.DB {
	return d.db
}

func (d *DB) Close() error {
	return d.db.Close()
}

func (d *DB) IsInitialized(ctx context.Context) (bool, error) {
	var exists bool
	err := d.db.QueryRowContext(ctx, "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_catalog = current_database() AND table_name = 'memo' AND table_type = 'BASE TABLE')").Scan(&exists)
	if err != nil {
		return false, errors.Wrap(err, "failed to check if database is initialized")
	}
	return exists, nil
}

// GetDatabaseSize returns the database size in bytes, or -1 if unavailable.
func (d *DB) GetDatabaseSize(ctx context.Context) (int64, error) {
	var size int64
	const q = `SELECT pg_database_size(current_database())`
	if err := d.db.QueryRowContext(ctx, q).Scan(&size); err != nil {
		return -1, errors.Wrap(err, "failed to query postgres database size")
	}
	return size, nil
}
