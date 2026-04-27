package pipeline

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

func (r *Repository) List(ctx context.Context) ([]Lead, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, company_name, contact_name, contact_email, value, stage, next_action,
		        notes, assigned_to, position, created_at, updated_at
		 FROM leads ORDER BY stage, position ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Lead
	for rows.Next() {
		var l Lead
		if err := rows.Scan(&l.ID, &l.CompanyName, &l.ContactName, &l.ContactEmail,
			&l.Value, &l.Stage, &l.NextAction, &l.Notes, &l.AssignedTo,
			&l.Position, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Lead, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var l Lead
	err := r.db.QueryRow(ctx,
		`SELECT id, company_name, contact_name, contact_email, value, stage, next_action,
		        notes, assigned_to, position, created_at, updated_at
		 FROM leads WHERE id = $1`, id,
	).Scan(&l.ID, &l.CompanyName, &l.ContactName, &l.ContactEmail,
		&l.Value, &l.Stage, &l.NextAction, &l.Notes, &l.AssignedTo,
		&l.Position, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *Repository) Create(ctx context.Context, req CreateLeadRequest) (*Lead, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	stage := req.Stage
	if stage == "" {
		stage = "outreach"
	}

	var maxPos *int
	r.db.QueryRow(ctx,
		`SELECT COALESCE(MAX(position), -1) FROM leads WHERE stage = $1`, stage,
	).Scan(&maxPos)
	pos := 0
	if maxPos != nil {
		pos = *maxPos + 1
	}

	var l Lead
	err := r.db.QueryRow(ctx,
		`INSERT INTO leads (company_name, contact_name, contact_email, value, stage, next_action, notes, assigned_to, position)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, company_name, contact_name, contact_email, value, stage, next_action,
		           notes, assigned_to, position, created_at, updated_at`,
		req.CompanyName, req.ContactName, req.ContactEmail, req.Value, stage,
		req.NextAction, req.Notes, req.AssignedTo, pos,
	).Scan(&l.ID, &l.CompanyName, &l.ContactName, &l.ContactEmail,
		&l.Value, &l.Stage, &l.NextAction, &l.Notes, &l.AssignedTo,
		&l.Position, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
}

func (r *Repository) Update(ctx context.Context, id string, req UpdateLeadRequest) (*Lead, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var l Lead
	err := r.db.QueryRow(ctx,
		`UPDATE leads SET
		   company_name  = COALESCE($2, company_name),
		   contact_name  = COALESCE($3, contact_name),
		   contact_email = COALESCE($4, contact_email),
		   value         = COALESCE($5, value),
		   stage         = COALESCE($6, stage),
		   next_action   = COALESCE($7, next_action),
		   notes         = COALESCE($8, notes),
		   assigned_to   = COALESCE($9, assigned_to),
		   updated_at    = NOW()
		 WHERE id = $1
		 RETURNING id, company_name, contact_name, contact_email, value, stage, next_action,
		           notes, assigned_to, position, created_at, updated_at`,
		id, req.CompanyName, req.ContactName, req.ContactEmail, req.Value,
		req.Stage, req.NextAction, req.Notes, req.AssignedTo,
	).Scan(&l.ID, &l.CompanyName, &l.ContactName, &l.ContactEmail,
		&l.Value, &l.Stage, &l.NextAction, &l.Notes, &l.AssignedTo,
		&l.Position, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
}

func (r *Repository) Move(ctx context.Context, id string, req MoveLeadRequest) (*Lead, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var l Lead
	err := r.db.QueryRow(ctx,
		`UPDATE leads SET stage = $2, position = $3, updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, company_name, contact_name, contact_email, value, stage, next_action,
		           notes, assigned_to, position, created_at, updated_at`,
		id, req.Stage, req.Position,
	).Scan(&l.ID, &l.CompanyName, &l.ContactName, &l.ContactEmail,
		&l.Value, &l.Stage, &l.NextAction, &l.Notes, &l.AssignedTo,
		&l.Position, &l.CreatedAt, &l.UpdatedAt)
	return &l, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM leads WHERE id = $1`, id)
	return err
}
