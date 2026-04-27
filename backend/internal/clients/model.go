package clients

import "time"

type Client struct {
	ID                string     `json:"id"`
	Name              string     `json:"name"`
	ContactName       *string    `json:"contact_name,omitempty"`
	ContactEmail      *string    `json:"contact_email,omitempty"`
	ContactPhone      *string    `json:"contact_phone,omitempty"`
	Package           string     `json:"package"`
	MonthlyValue      *float64   `json:"monthly_value,omitempty"`
	MonthlyProgress   int        `json:"monthly_progress"`
	Status            string     `json:"status"`
	InvoiceDay        *int       `json:"invoice_day,omitempty"`
	AssignedTo        *string    `json:"assigned_to,omitempty"`
	PortalActivatedAt *time.Time `json:"portal_activated_at,omitempty"`
	StartedAt         *time.Time `json:"started_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
}

type CreateClientRequest struct {
	Name         string   `json:"name" validate:"required"`
	ContactName  *string  `json:"contact_name,omitempty"`
	ContactEmail *string  `json:"contact_email,omitempty"`
	ContactPhone *string  `json:"contact_phone,omitempty"`
	Package      string   `json:"package" validate:"required"`
	MonthlyValue *float64 `json:"monthly_value,omitempty"`
	InvoiceDay   *int     `json:"invoice_day,omitempty"`
	AssignedTo   *string  `json:"assigned_to,omitempty"`
	StartedAt    *string  `json:"started_at,omitempty"`
}

type UpdateClientRequest struct {
	Name            *string  `json:"name,omitempty"`
	ContactName     *string  `json:"contact_name,omitempty"`
	ContactEmail    *string  `json:"contact_email,omitempty"`
	ContactPhone    *string  `json:"contact_phone,omitempty"`
	Package         *string  `json:"package,omitempty"`
	MonthlyValue    *float64 `json:"monthly_value,omitempty"`
	MonthlyProgress *int     `json:"monthly_progress,omitempty"`
	Status          *string  `json:"status,omitempty"`
	InvoiceDay      *int     `json:"invoice_day,omitempty"`
	AssignedTo      *string  `json:"assigned_to,omitempty"`
}
