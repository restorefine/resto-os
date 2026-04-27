package invoices

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

func (r *Repository) List(ctx context.Context, clientID string) ([]Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	query := `SELECT id, client_id, reference, amount, due_date, paid_at, status, created_at
	          FROM invoices`
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

	var list []Invoice
	for rows.Next() {
		var inv Invoice
		if err := rows.Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
			&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, inv)
	}
	return list, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var inv Invoice
	err := r.db.QueryRow(ctx,
		`SELECT id, client_id, reference, amount, due_date, paid_at, status, created_at
		 FROM invoices WHERE id = $1`, id,
	).Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
		&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *Repository) CountByYear(ctx context.Context, year int) (int, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var count int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM invoices WHERE EXTRACT(YEAR FROM created_at) = $1`, year,
	).Scan(&count)
	return count, err
}

func (r *Repository) Create(ctx context.Context, clientID, reference string, amount float64, dueDate time.Time) (*Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var inv Invoice
	err := r.db.QueryRow(ctx,
		`INSERT INTO invoices (client_id, reference, amount, due_date)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, client_id, reference, amount, due_date, paid_at, status, created_at`,
		clientID, reference, amount, dueDate,
	).Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
		&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt)
	return &inv, err
}

func (r *Repository) MarkPaid(ctx context.Context, id string) (*Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var inv Invoice
	err := r.db.QueryRow(ctx,
		`UPDATE invoices SET status = 'paid', paid_at = NOW()
		 WHERE id = $1
		 RETURNING id, client_id, reference, amount, due_date, paid_at, status, created_at`, id,
	).Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
		&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt)
	return &inv, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM invoices WHERE id = $1`, id)
	return err
}

// OverdueToday returns invoices due today that are still unpaid (for reminders).
func (r *Repository) DueToday(ctx context.Context) ([]Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, client_id, reference, amount, due_date, paid_at, status, created_at
		 FROM invoices WHERE due_date = CURRENT_DATE AND status = 'unpaid'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Invoice
	for rows.Next() {
		var inv Invoice
		if err := rows.Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
			&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, inv)
	}
	return list, nil
}

// MarkOverdue sets all past-due unpaid invoices to overdue and returns them.
func (r *Repository) MarkOverdue(ctx context.Context) ([]Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`UPDATE invoices SET status = 'overdue'
		 WHERE due_date < CURRENT_DATE AND status = 'unpaid'
		 RETURNING id, client_id, reference, amount, due_date, paid_at, status, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Invoice
	for rows.Next() {
		var inv Invoice
		if err := rows.Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
			&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, inv)
	}
	return list, nil
}
