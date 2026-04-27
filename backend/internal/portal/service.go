package portal

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/restorefine/agencyos/internal/clients"
	"github.com/restorefine/agencyos/internal/content"
	"github.com/restorefine/agencyos/internal/invoices"
	"github.com/restorefine/agencyos/internal/videos"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetMyClient(ctx context.Context, clientID string) (*clients.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c clients.Client
	err := s.db.QueryRow(ctx,
		`SELECT id, name, contact_name, contact_email, contact_phone, package,
		        monthly_value, monthly_progress, status, invoice_day, assigned_to,
		        portal_activated_at, started_at, created_at
		 FROM clients WHERE id = $1`, clientID,
	).Scan(&c.ID, &c.Name, &c.ContactName, &c.ContactEmail, &c.ContactPhone,
		&c.Package, &c.MonthlyValue, &c.MonthlyProgress, &c.Status, &c.InvoiceDay,
		&c.AssignedTo, &c.PortalActivatedAt, &c.StartedAt, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Service) GetMyInvoices(ctx context.Context, clientID string) ([]invoices.Invoice, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := s.db.Query(ctx,
		`SELECT id, client_id, reference, amount, due_date, paid_at, status, created_at
		 FROM invoices WHERE client_id = $1 ORDER BY created_at DESC`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []invoices.Invoice
	for rows.Next() {
		var inv invoices.Invoice
		if err := rows.Scan(&inv.ID, &inv.ClientID, &inv.Reference, &inv.Amount,
			&inv.DueDate, &inv.PaidAt, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, inv)
	}
	return list, nil
}

func (s *Service) GetMyVideos(ctx context.Context, clientID string) ([]videos.Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := s.db.Query(ctx,
		`SELECT id, client_id, title, platform, video_url, thumbnail_url, status,
		        production_stage, feedback, version, uploaded_by, approved_by,
		        approved_at, due_date, created_at
		 FROM videos WHERE client_id = $1 ORDER BY created_at DESC`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []videos.Video
	for rows.Next() {
		var v videos.Video
		if err := rows.Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
			&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
			&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, v)
	}
	return list, nil
}

func (s *Service) ApproveVideo(ctx context.Context, videoID, approverID string) (*videos.Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var v videos.Video
	err := s.db.QueryRow(ctx,
		`UPDATE videos SET status = 'approved', approved_by = $2, approved_at = NOW()
		 WHERE id = $1
		 RETURNING id, client_id, title, platform, video_url, thumbnail_url, status,
		           production_stage, feedback, version, uploaded_by, approved_by,
		           approved_at, due_date, created_at`,
		videoID, approverID,
	).Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
		&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
		&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt)
	return &v, err
}

func (s *Service) GetMyContent(ctx context.Context, clientID string) ([]content.ContentItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := s.db.Query(ctx,
		`SELECT id, client_id, title, type, due_date, status, assigned_to, notes, created_at
		 FROM content_items WHERE client_id = $1 ORDER BY created_at DESC`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []content.ContentItem
	for rows.Next() {
		var c content.ContentItem
		if err := rows.Scan(&c.ID, &c.ClientID, &c.Title, &c.Type, &c.DueDate,
			&c.Status, &c.AssignedTo, &c.Notes, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}
