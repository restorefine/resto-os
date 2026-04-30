package contracts

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

// ─── Existing contract methods ────────────────────────────────────────────────

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

// ─── Contract link methods ────────────────────────────────────────────────────

func scanLink(row interface {
	Scan(...interface{}) error
}) (*ContractLink, error) {
	var link ContractLink
	var dataStr string
	err := row.Scan(
		&link.ID, &link.Token, &dataStr, &link.ClientName, &link.ClientCompany,
		&link.ClientSignature, &link.SignedAt, &link.ExpiresAt, &link.CreatedBy, &link.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(dataStr), &link.ContractData)
	link.Status = link.computeStatus()
	return &link, nil
}

func (r *Repository) CreateContractLink(ctx context.Context, token string, data ContractLinkData, createdBy string, expiresAt time.Time) (*ContractLink, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	row := r.db.QueryRow(ctx,
		`INSERT INTO contract_links (token, contract_data, client_name, client_company, created_by, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, token, contract_data, client_name, client_company, client_signature, signed_at, expires_at, created_by, created_at`,
		token, string(dataJSON), data.ClientName, data.ClientCompany, createdBy, expiresAt,
	)
	return scanLink(row)
}

func (r *Repository) GetContractLinkByToken(ctx context.Context, token string) (*ContractLink, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	row := r.db.QueryRow(ctx,
		`SELECT id, token, contract_data, client_name, client_company, client_signature, signed_at, expires_at, created_by, created_at
		 FROM contract_links WHERE token = $1`,
		token,
	)
	return scanLink(row)
}

func (r *Repository) SignContractLink(ctx context.Context, token, signature string, signedAt time.Time) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx,
		`UPDATE contract_links SET client_signature = $1, signed_at = $2 WHERE token = $3`,
		signature, signedAt, token,
	)
	return err
}

func (r *Repository) ListContractLinks(ctx context.Context) ([]ContractLink, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, token, contract_data, client_name, client_company, client_signature, signed_at, expires_at, created_by, created_at
		 FROM contract_links ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []ContractLink
	for rows.Next() {
		link, err := scanLink(rows)
		if err != nil {
			return nil, err
		}
		links = append(links, *link)
	}
	return links, nil
}

func (r *Repository) DeleteContractLink(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM contract_links WHERE id = $1`, id)
	return err
}
