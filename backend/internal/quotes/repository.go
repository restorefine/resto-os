package quotes

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, clientID string) ([]Quote, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	query := `SELECT id, client_id, reference, items, subtotal, vat, total, valid_until, status, created_by, created_at
	          FROM quotes`
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

	var list []Quote
	for rows.Next() {
		var q Quote
		var itemsJSON []byte
		if err := rows.Scan(&q.ID, &q.ClientID, &q.Reference, &itemsJSON, &q.Subtotal, &q.VAT,
			&q.Total, &q.ValidUntil, &q.Status, &q.CreatedBy, &q.CreatedAt); err != nil {
			return nil, err
		}
		q.Items = json.RawMessage(itemsJSON)
		list = append(list, q)
	}
	return list, nil
}

func (r *Repository) CountByYear(ctx context.Context, year int) (int, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var count int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM quotes WHERE EXTRACT(YEAR FROM created_at) = $1`, year,
	).Scan(&count)
	return count, err
}

func (r *Repository) Create(ctx context.Context, clientID, reference, createdBy string,
	itemsJSON []byte, subtotal, vat, total float64, validUntil *time.Time) (*Quote, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var q Quote
	var rawItems []byte
	err := r.db.QueryRow(ctx,
		`INSERT INTO quotes (client_id, reference, items, subtotal, vat, total, valid_until, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, client_id, reference, items, subtotal, vat, total, valid_until, status, created_by, created_at`,
		clientID, reference, itemsJSON, subtotal, vat, total, validUntil, createdBy,
	).Scan(&q.ID, &q.ClientID, &q.Reference, &rawItems, &q.Subtotal, &q.VAT,
		&q.Total, &q.ValidUntil, &q.Status, &q.CreatedBy, &q.CreatedAt)
	if err != nil {
		return nil, err
	}
	q.Items = json.RawMessage(rawItems)
	return &q, nil
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM quotes WHERE id = $1`, id)
	return err
}
