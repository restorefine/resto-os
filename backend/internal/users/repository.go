package users

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

func (r *Repository) List(ctx context.Context) ([]User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, name, email, role, client_id, must_change_password, portal_activated_at, last_login_at, created_at
		 FROM users ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.ClientID,
			&u.MustChangePassword, &u.PortalActivatedAt, &u.LastLoginAt, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var u User
	err := r.db.QueryRow(ctx,
		`SELECT id, name, email, role, client_id, must_change_password, portal_activated_at, last_login_at, created_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.ClientID,
		&u.MustChangePassword, &u.PortalActivatedAt, &u.LastLoginAt, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) Create(ctx context.Context, name, email, passwordHash, role string, clientID *string) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var u User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (name, email, password_hash, role, client_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, name, email, role, client_id, must_change_password, portal_activated_at, last_login_at, created_at`,
		name, email, passwordHash, role, clientID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.ClientID,
		&u.MustChangePassword, &u.PortalActivatedAt, &u.LastLoginAt, &u.CreatedAt)
	return &u, err
}

func (r *Repository) Update(ctx context.Context, id string, req UpdateUserRequest) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var u User
	err := r.db.QueryRow(ctx,
		`UPDATE users SET
		   name      = COALESCE($2, name),
		   email     = COALESCE($3, email),
		   role      = COALESCE($4, role),
		   client_id = COALESCE($5, client_id)
		 WHERE id = $1
		 RETURNING id, name, email, role, client_id, must_change_password, portal_activated_at, last_login_at, created_at`,
		id, req.Name, req.Email, req.Role, req.ClientID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.ClientID,
		&u.MustChangePassword, &u.PortalActivatedAt, &u.LastLoginAt, &u.CreatedAt)
	return &u, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

func (r *Repository) CountUsers(ctx context.Context) (int, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}

func (r *Repository) UpsertSeedUser(ctx context.Context, name, email, passwordHash, role string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx,
		`INSERT INTO users (name, email, password_hash, role)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (email) DO UPDATE SET
		   name          = EXCLUDED.name,
		   role          = EXCLUDED.role,
		   password_hash = EXCLUDED.password_hash`,
		name, email, passwordHash, role,
	)
	return err
}

// CreateClientUser creates a portal user with role=client and must_change_password=true.
func (r *Repository) CreateClientUser(ctx context.Context, email, name, passwordHash, clientID string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx,
		`INSERT INTO users (name, email, password_hash, role, client_id, must_change_password)
		 VALUES ($1, $2, $3, 'client', $4, TRUE)
		 ON CONFLICT (email) DO NOTHING`,
		name, email, passwordHash, clientID,
	)
	return err
}
