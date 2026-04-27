package clients

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

func (r *Repository) List(ctx context.Context) ([]Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, name, contact_name, contact_email, contact_phone, package,
		        monthly_value, monthly_progress, status, invoice_day, assigned_to,
		        portal_activated_at, started_at, created_at
		 FROM clients ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []Client
	for rows.Next() {
		var c Client
		if err := rows.Scan(&c.ID, &c.Name, &c.ContactName, &c.ContactEmail, &c.ContactPhone,
			&c.Package, &c.MonthlyValue, &c.MonthlyProgress, &c.Status, &c.InvoiceDay,
			&c.AssignedTo, &c.PortalActivatedAt, &c.StartedAt, &c.CreatedAt); err != nil {
			return nil, err
		}
		clients = append(clients, c)
	}
	return clients, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c Client
	err := r.db.QueryRow(ctx,
		`SELECT id, name, contact_name, contact_email, contact_phone, package,
		        monthly_value, monthly_progress, status, invoice_day, assigned_to,
		        portal_activated_at, started_at, created_at
		 FROM clients WHERE id = $1`, id,
	).Scan(&c.ID, &c.Name, &c.ContactName, &c.ContactEmail, &c.ContactPhone,
		&c.Package, &c.MonthlyValue, &c.MonthlyProgress, &c.Status, &c.InvoiceDay,
		&c.AssignedTo, &c.PortalActivatedAt, &c.StartedAt, &c.CreatedAt)
	return &c, err
}

func (r *Repository) Create(ctx context.Context, req CreateClientRequest) (*Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c Client
	err := r.db.QueryRow(ctx,
		`INSERT INTO clients (name, contact_name, contact_email, contact_phone, package, monthly_value, invoice_day, assigned_to, started_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, name, contact_name, contact_email, contact_phone, package,
		           monthly_value, monthly_progress, status, invoice_day, assigned_to,
		           portal_activated_at, started_at, created_at`,
		req.Name, req.ContactName, req.ContactEmail, req.ContactPhone,
		req.Package, req.MonthlyValue, req.InvoiceDay, req.AssignedTo, req.StartedAt,
	).Scan(&c.ID, &c.Name, &c.ContactName, &c.ContactEmail, &c.ContactPhone,
		&c.Package, &c.MonthlyValue, &c.MonthlyProgress, &c.Status, &c.InvoiceDay,
		&c.AssignedTo, &c.PortalActivatedAt, &c.StartedAt, &c.CreatedAt)
	return &c, err
}

func (r *Repository) Update(ctx context.Context, id string, req UpdateClientRequest) (*Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c Client
	err := r.db.QueryRow(ctx,
		`UPDATE clients SET
		   name             = COALESCE($2, name),
		   contact_name     = COALESCE($3, contact_name),
		   contact_email    = COALESCE($4, contact_email),
		   contact_phone    = COALESCE($5, contact_phone),
		   package          = COALESCE($6, package),
		   monthly_value    = COALESCE($7, monthly_value),
		   monthly_progress = COALESCE($8, monthly_progress),
		   status           = COALESCE($9, status),
		   invoice_day      = COALESCE($10, invoice_day),
		   assigned_to      = COALESCE($11, assigned_to)
		 WHERE id = $1
		 RETURNING id, name, contact_name, contact_email, contact_phone, package,
		           monthly_value, monthly_progress, status, invoice_day, assigned_to,
		           portal_activated_at, started_at, created_at`,
		id, req.Name, req.ContactName, req.ContactEmail, req.ContactPhone,
		req.Package, req.MonthlyValue, req.MonthlyProgress, req.Status,
		req.InvoiceDay, req.AssignedTo,
	).Scan(&c.ID, &c.Name, &c.ContactName, &c.ContactEmail, &c.ContactPhone,
		&c.Package, &c.MonthlyValue, &c.MonthlyProgress, &c.Status, &c.InvoiceDay,
		&c.AssignedTo, &c.PortalActivatedAt, &c.StartedAt, &c.CreatedAt)
	return &c, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM clients WHERE id = $1`, id)
	return err
}

func (r *Repository) SetPortalActivated(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx,
		`UPDATE clients SET portal_activated_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *Repository) AllOnboardingComplete(ctx context.Context, clientID string) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var total, completed int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = TRUE)
		 FROM onboarding_steps WHERE client_id = $1`, clientID,
	).Scan(&total, &completed)
	if err != nil {
		return false, err
	}
	return total > 0 && total == completed, nil
}
