package mailer

import (
	"fmt"
	"log"
	"os"

	resend "github.com/resend/resend-go/v2"
)

type Mailer struct {
	client *resend.Client
	from   string
	dev    bool
}

func New() *Mailer {
	apiKey := os.Getenv("RESEND_API_KEY")
	dev := apiKey == "" || apiKey == "re_placeholder"
	var client *resend.Client
	if !dev {
		client = resend.NewClient(apiKey)
	}
	return &Mailer{
		client: client,
		from:   "AgencyOS <noreply@restorefine.co.uk>",
		dev:    dev,
	}
}

func (m *Mailer) Send(to, subject, html string) error {
	if m.dev {
		log.Printf("[MAILER DEV] To: %s | Subject: %s\n%s\n", to, subject, html)
		return nil
	}
	params := &resend.SendEmailRequest{
		From:    m.from,
		To:      []string{to},
		Subject: subject,
		Html:    html,
	}
	_, err := m.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send: %w", err)
	}
	return nil
}

func (m *Mailer) SendPortalWelcome(to, name, tempPassword string) error {
	html := fmt.Sprintf(`
<h2>Welcome to the AgencyOS Client Portal</h2>
<p>Hi %s,</p>
<p>Your client portal has been activated. You can now log in using:</p>
<p><strong>Email:</strong> %s<br>
<strong>Temporary Password:</strong> %s</p>
<p>You will be prompted to change your password on first login.</p>
<p>Best,<br>RestoRefine Studios</p>
`, name, to, tempPassword)
	return m.Send(to, "Your Client Portal is Ready", html)
}

func (m *Mailer) SendInvoiceReminder(to, clientName, reference string, amount float64, dueDate string) error {
	html := fmt.Sprintf(`
<h2>Invoice Reminder</h2>
<p>Hi %s,</p>
<p>This is a reminder that invoice <strong>%s</strong> for <strong>£%.2f</strong> is due on <strong>%s</strong>.</p>
<p>Please arrange payment at your earliest convenience.</p>
<p>Best,<br>RestoRefine Studios</p>
`, clientName, reference, amount, dueDate)
	return m.Send(to, fmt.Sprintf("Invoice Reminder: %s", reference), html)
}

func (m *Mailer) SendOverdueNotice(to, reference string, amount float64) error {
	html := fmt.Sprintf(`
<h2>Overdue Invoice Notice</h2>
<p>Invoice <strong>%s</strong> for <strong>£%.2f</strong> is now overdue.</p>
<p>Please follow up with the client immediately.</p>
`, reference, amount)
	return m.Send(to, fmt.Sprintf("OVERDUE: Invoice %s", reference), html)
}
