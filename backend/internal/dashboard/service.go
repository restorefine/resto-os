package dashboard

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MRRMonth struct {
	Month string  `json:"month"`
	Value float64 `json:"value"`
}

type Stats struct {
	MRR                 float64    `json:"mrr"`
	ActiveClients       int        `json:"active_clients"`
	UnpaidInvoicesCount int        `json:"unpaid_invoices_count"`
	UnpaidInvoicesTotal float64    `json:"unpaid_invoices_total"`
	PipelineValue       float64    `json:"pipeline_value"`
	PendingVideosCount  int        `json:"pending_videos_count"`
	OverdueInvoices     int        `json:"overdue_invoices"`
	MRRTrend            []MRRMonth `json:"mrr_trend"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetStats(ctx context.Context) (*Stats, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	stats := &Stats{
		MRRTrend: []MRRMonth{},
	}

	// MRR: sum of monthly_value for active clients
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(monthly_value), 0) FROM clients WHERE status = 'active'`,
	).Scan(&stats.MRR)

	// Active clients count
	s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM clients WHERE status = 'active'`,
	).Scan(&stats.ActiveClients)

	// Unpaid invoices
	s.db.QueryRow(ctx,
		`SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'unpaid'`,
	).Scan(&stats.UnpaidInvoicesCount, &stats.UnpaidInvoicesTotal)

	// Overdue invoices
	s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM invoices WHERE status = 'overdue'`,
	).Scan(&stats.OverdueInvoices)

	// Pipeline value
	s.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(value), 0) FROM leads WHERE stage != 'closed_lost'`,
	).Scan(&stats.PipelineValue)

	// Pending videos
	s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM videos WHERE status = 'pending'`,
	).Scan(&stats.PendingVideosCount)

	// MRR trend: last 6 months based on paid invoices
	rows, err := s.db.Query(ctx,
		`SELECT TO_CHAR(paid_at, 'Mon YYYY') AS month,
		        SUM(amount) AS value
		 FROM invoices
		 WHERE status = 'paid'
		   AND paid_at >= NOW() - INTERVAL '6 months'
		 GROUP BY TO_CHAR(paid_at, 'Mon YYYY'), DATE_TRUNC('month', paid_at)
		 ORDER BY DATE_TRUNC('month', paid_at) ASC`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var m MRRMonth
			if err := rows.Scan(&m.Month, &m.Value); err == nil {
				stats.MRRTrend = append(stats.MRRTrend, m)
			}
		}
	}

	return stats, nil
}
