package content

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

func (r *Repository) List(ctx context.Context, clientID string) ([]ContentItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	query := `SELECT id, client_id, title, type, due_date, status, assigned_to, notes, created_at
	          FROM content_items`
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

	var list []ContentItem
	for rows.Next() {
		var c ContentItem
		if err := rows.Scan(&c.ID, &c.ClientID, &c.Title, &c.Type, &c.DueDate,
			&c.Status, &c.AssignedTo, &c.Notes, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) Create(ctx context.Context, req CreateContentRequest, dueDate *time.Time) (*ContentItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c ContentItem
	err := r.db.QueryRow(ctx,
		`INSERT INTO content_items (client_id, title, type, due_date, assigned_to, notes)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, client_id, title, type, due_date, status, assigned_to, notes, created_at`,
		req.ClientID, req.Title, req.Type, dueDate, req.AssignedTo, req.Notes,
	).Scan(&c.ID, &c.ClientID, &c.Title, &c.Type, &c.DueDate,
		&c.Status, &c.AssignedTo, &c.Notes, &c.CreatedAt)
	return &c, err
}

func (r *Repository) Update(ctx context.Context, id string, req UpdateContentRequest, dueDate *time.Time) (*ContentItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c ContentItem
	err := r.db.QueryRow(ctx,
		`UPDATE content_items SET
		   title       = COALESCE($2, title),
		   type        = COALESCE($3, type),
		   due_date    = COALESCE($4, due_date),
		   status      = COALESCE($5, status),
		   assigned_to = COALESCE($6, assigned_to),
		   notes       = COALESCE($7, notes)
		 WHERE id = $1
		 RETURNING id, client_id, title, type, due_date, status, assigned_to, notes, created_at`,
		id, req.Title, req.Type, dueDate, req.Status, req.AssignedTo, req.Notes,
	).Scan(&c.ID, &c.ClientID, &c.Title, &c.Type, &c.DueDate,
		&c.Status, &c.AssignedTo, &c.Notes, &c.CreatedAt)
	return &c, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM content_items WHERE id = $1`, id)
	return err
}
