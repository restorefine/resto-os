package invoices

import "time"

type Invoice struct {
	ID        string     `json:"id"`
	ClientID  string     `json:"client_id"`
	Reference string     `json:"reference"`
	Amount    float64    `json:"amount"`
	DueDate   time.Time  `json:"due_date"`
	PaidAt    *time.Time `json:"paid_at,omitempty"`
	Status    string     `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
}

type CreateInvoiceRequest struct {
	ClientID string  `json:"client_id" validate:"required"`
	Amount   float64 `json:"amount" validate:"required,gt=0"`
	DueDate  string  `json:"due_date" validate:"required"`
}
