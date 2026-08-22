package trashretention

import (
	"context"
	"log/slog"
	"regexp"
	"strings"
	"time"

	"github.com/usememos/memos/store"
)

const (
	RetentionPeriod = 30 * 24 * time.Hour
	runnerInterval  = time.Hour
)

var (
	trashMarkerPattern    = regexp.MustCompile(`(?i)<!--\s*goreecloud-note-trash:\s*(normal|archived)\s*-->`)
	trashTimestampPattern = regexp.MustCompile(`(?i)\n*<!--\s*goreecloud-note-trash-at:\s*([^>]*?)\s*-->`)
)

type retentionDecision int

const (
	retentionSkip retentionDecision = iota
	retentionStamp
	retentionDelete
)

type SweepStats struct {
	Scanned int
	Stamped int
	Deleted int
	Failed  int
}

type Runner struct {
	Store *store.Store
}

func NewRunner(store *store.Store) *Runner {
	return &Runner{Store: store}
}

func (r *Runner) Run(ctx context.Context) {
	ticker := time.NewTicker(runnerInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			r.RunOnce(ctx)
		case <-ctx.Done():
			return
		}
	}
}

func (r *Runner) RunOnce(ctx context.Context) {
	stats, err := r.Sweep(ctx, time.Now().UTC())
	if err != nil {
		slog.Error("Failed to run GoreeCloud Trash retention sweep", slog.String("error", err.Error()))
		return
	}
	if stats.Stamped > 0 || stats.Deleted > 0 || stats.Failed > 0 {
		slog.Info(
			"Completed GoreeCloud Trash retention sweep",
			slog.Int("scanned", stats.Scanned),
			slog.Int("stamped", stats.Stamped),
			slog.Int("deleted", stats.Deleted),
			slog.Int("failed", stats.Failed),
		)
	}
}

func (r *Runner) Sweep(ctx context.Context, now time.Time) (SweepStats, error) {
	stats := SweepStats{}
	state := store.Normal
	memos, err := r.Store.ListMemos(ctx, &store.FindMemo{
		RowStatus:       &state,
		ExcludeComments: true,
	})
	if err != nil {
		return stats, err
	}

	for _, memo := range memos {
		stats.Scanned++
		switch decideRetention(memo.Content, now) {
		case retentionStamp:
			if err := r.stampLegacyTrash(ctx, memo.ID, now); err != nil {
				stats.Failed++
				slog.Warn("Failed to stamp GoreeCloud Trash retention metadata", slog.Int64("memo_id", int64(memo.ID)), slog.String("error", err.Error()))
				continue
			}
			stats.Stamped++
		case retentionDelete:
			deleted, err := r.deleteExpiredTrash(ctx, memo.ID, now)
			if err != nil {
				stats.Failed++
				slog.Warn("Failed to permanently delete expired GoreeCloud Trash memo", slog.Int64("memo_id", int64(memo.ID)), slog.String("error", err.Error()))
				continue
			}
			if deleted {
				stats.Deleted++
			}
		}
	}

	return stats, nil
}

func (r *Runner) stampLegacyTrash(ctx context.Context, memoID int32, now time.Time) error {
	latest, err := r.Store.GetMemo(ctx, &store.FindMemo{ID: &memoID})
	if err != nil || latest == nil {
		return err
	}
	if decideRetention(latest.Content, now) != retentionStamp {
		return nil
	}

	content := withTrashTimestamp(latest.Content, now)
	return r.Store.UpdateMemo(ctx, &store.UpdateMemo{ID: latest.ID, Content: &content})
}

func (r *Runner) deleteExpiredTrash(ctx context.Context, memoID int32, now time.Time) (bool, error) {
	latest, err := r.Store.GetMemo(ctx, &store.FindMemo{ID: &memoID})
	if err != nil || latest == nil {
		return false, err
	}
	if decideRetention(latest.Content, now) != retentionDelete {
		return false, nil
	}

	commentType := store.MemoRelationComment
	relations, err := r.Store.ListMemoRelations(ctx, &store.FindMemoRelation{
		RelatedMemoID: &latest.ID,
		Type:          &commentType,
	})
	if err != nil {
		return false, err
	}
	for _, relation := range relations {
		if err := r.Store.DeleteMemo(ctx, &store.DeleteMemo{ID: relation.MemoID}); err != nil {
			return false, err
		}
	}
	if err := r.Store.DeleteMemo(ctx, &store.DeleteMemo{ID: latest.ID}); err != nil {
		return false, err
	}
	return true, nil
}

func decideRetention(content string, now time.Time) retentionDecision {
	if !trashMarkerPattern.MatchString(content) {
		return retentionSkip
	}
	trashedAt, ok := parseTrashTimestamp(content)
	if !ok {
		return retentionStamp
	}
	if !trashedAt.Add(RetentionPeriod).After(now) {
		return retentionDelete
	}
	return retentionSkip
}

func parseTrashTimestamp(content string) (time.Time, bool) {
	match := trashTimestampPattern.FindStringSubmatch(content)
	if len(match) != 2 {
		return time.Time{}, false
	}
	trashedAt, err := time.Parse(time.RFC3339Nano, strings.TrimSpace(match[1]))
	if err != nil {
		return time.Time{}, false
	}
	return trashedAt.UTC(), true
}

func withTrashTimestamp(content string, trashedAt time.Time) string {
	withoutTimestamp := strings.TrimRight(trashTimestampPattern.ReplaceAllString(content, ""), "\n")
	marker := "<!-- goreecloud-note-trash-at: " + trashedAt.UTC().Format(time.RFC3339Nano) + " -->"
	if withoutTimestamp == "" {
		return marker
	}
	return withoutTimestamp + "\n" + marker
}
