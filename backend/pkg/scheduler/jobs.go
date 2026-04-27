package scheduler

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/restorefine/agencyos/pkg/mailer"
)

type Scheduler struct {
	db     *pgxpool.Pool
	mailer *mailer.Mailer
}

func New(db *pgxpool.Pool, m *mailer.Mailer) *Scheduler {
	return &Scheduler{db: db, mailer: m}
}

// Start begins the 24-hour tick loop. Run this in a goroutine.
func (s *Scheduler) Start() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	// Run once immediately on startup
	s.run()

	for range ticker.C {
		s.run()
	}
}

func (s *Scheduler) run() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	s.sendDueReminders(ctx)
	s.markAndNotifyOverdue(ctx)
}

type invoiceRow struct {
	ID           string
	ClientID     string
	Reference    string
	Amount       float64
	DueDateStr   string
	ClientName   string
	ContactEmail string
}

func (s *Scheduler) sendDueReminders(ctx context.Context) {
	rows, err := s.db.Query(ctx,
		`SELECT i.id, i.client_id, i.reference, i.amount,
		        TO_CHAR(i.due_date, 'DD Mon YYYY'),
		        c.name, COALESCE(c.contact_email, '')
		 FROM invoices i
		 JOIN clients c ON c.id = i.client_id
		 WHERE i.due_date = CURRENT_DATE AND i.status = 'unpaid'`)
	if err != nil {
		log.Printf("[SCHEDULER] sendDueReminders query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var row invoiceRow
		if err := rows.Scan(&row.ID, &row.ClientID, &row.Reference, &row.Amount,
			&row.DueDateStr, &row.ClientName, &row.ContactEmail); err != nil {
			log.Printf("[SCHEDULER] scan error: %v", err)
			continue
		}
		if row.ContactEmail == "" {
			continue
		}
		if err := s.mailer.SendInvoiceReminder(row.ContactEmail, row.ClientName, row.Reference, row.Amount, row.DueDateStr); err != nil {
			log.Printf("[SCHEDULER] reminder send error for %s: %v", row.Reference, err)
		} else {
			log.Printf("[SCHEDULER] sent reminder for invoice %s to %s", row.Reference, row.ContactEmail)
		}
	}
}

func (s *Scheduler) markAndNotifyOverdue(ctx context.Context) {
	rows, err := s.db.Query(ctx,
		`UPDATE invoices SET status = 'overdue'
		 WHERE due_date < CURRENT_DATE AND status = 'unpaid'
		 RETURNING id, client_id, reference, amount`)
	if err != nil {
		log.Printf("[SCHEDULER] markAndNotifyOverdue error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, clientID, reference string
		var amount float64
		if err := rows.Scan(&id, &clientID, &reference, &amount); err != nil {
			continue
		}

		// Fetch client contact email
		var contactEmail string
		s.db.QueryRow(ctx,
			`SELECT COALESCE(contact_email, '') FROM clients WHERE id = $1`, clientID,
		).Scan(&contactEmail)

		if contactEmail == "" {
			continue
		}

		if err := s.mailer.SendOverdueNotice(contactEmail, reference, amount); err != nil {
			log.Printf("[SCHEDULER] overdue notice error for %s: %v", reference, err)
		} else {
			log.Printf("[SCHEDULER] sent overdue notice for invoice %s to %s", reference, contactEmail)
		}
	}
}
