package onboarding

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetByClient(ctx context.Context, clientID string) ([]Step, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, client_id, step, completed, completed_at, created_at
		 FROM onboarding_steps WHERE client_id = $1 ORDER BY created_at ASC`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Step
	for rows.Next() {
		var s Step
		if err := rows.Scan(&s.ID, &s.ClientID, &s.Step, &s.Completed, &s.CompletedAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *Repository) ToggleStep(ctx context.Context, stepID string, completed bool) (*Step, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var completedAt interface{}
	if completed {
		now := time.Now()
		completedAt = now
	}

	var s Step
	err := r.db.QueryRow(ctx,
		`UPDATE onboarding_steps SET completed = $2, completed_at = $3
		 WHERE id = $1
		 RETURNING id, client_id, step, completed, completed_at, created_at`,
		stepID, completed, completedAt,
	).Scan(&s.ID, &s.ClientID, &s.Step, &s.Completed, &s.CompletedAt, &s.CreatedAt)
	return &s, err
}

// EnsureDefaultSteps creates default onboarding steps for a new client if none exist.
func (r *Repository) GetAll(ctx context.Context) ([]Step, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, client_id, step, completed, completed_at, created_at
		 FROM onboarding_steps ORDER BY client_id, created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Step
	for rows.Next() {
		var s Step
		if err := rows.Scan(&s.ID, &s.ClientID, &s.Step, &s.Completed, &s.CompletedAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *Repository) EnsureDefaultSteps(ctx context.Context, clientID string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	defaultSteps := []string{
		"contract_signed",
		"payment_details",
		"brand_assets",
		"social_access",
		"kick_off_call",
	}

	for _, step := range defaultSteps {
		_, err := r.db.Exec(ctx,
			`INSERT INTO onboarding_steps (client_id, step) VALUES ($1, $2)
			 ON CONFLICT (client_id, step) DO NOTHING`,
			clientID, step,
		)
		if err != nil {
			return err
		}
	}
	return nil
}
