package contracts

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

func (r *Repository) List(ctx context.Context, clientID string) ([]Contract, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	query := `SELECT id, client_id, package, start_date, duration_months, special_terms, status, created_by, created_at
	          FROM contracts`
	args := []interface{}{}
	if clientID != "" {
		query += ` WHERE client_id = $1`
		args = append(args, clientID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Contract
	for rows.Next() {
		var c Contract
		if err := rows.Scan(&c.ID, &c.ClientID, &c.Package, &c.StartDate, &c.DurationMonths,
			&c.SpecialTerms, &c.Status, &c.CreatedBy, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) Create(ctx context.Context, req CreateContractRequest, createdBy string, startDate *time.Time) (*Contract, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c Contract
	err := r.db.QueryRow(ctx,
		`INSERT INTO contracts (client_id, package, start_date, duration_months, special_terms, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, client_id, package, start_date, duration_months, special_terms, status, created_by, created_at`,
		req.ClientID, req.Package, startDate, req.DurationMonths, req.SpecialTerms, createdBy,
	).Scan(&c.ID, &c.ClientID, &c.Package, &c.StartDate, &c.DurationMonths,
		&c.SpecialTerms, &c.Status, &c.CreatedBy, &c.CreatedAt)
	return &c, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM contracts WHERE id = $1`, id)
	return err
}
