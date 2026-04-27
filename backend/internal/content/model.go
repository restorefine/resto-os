package content

import "time"

type ContentItem struct {
	ID         string     `json:"id"`
	ClientID   string     `json:"client_id"`
	Title      string     `json:"title"`
	Type       string     `json:"type"`
	DueDate    *time.Time `json:"due_date,omitempty"`
	Status     string     `json:"status"`
	AssignedTo *string    `json:"assigned_to,omitempty"`
	Notes      *string    `json:"notes,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateContentRequest struct {
	ClientID   string  `json:"client_id" validate:"required"`
	Title      string  `json:"title" validate:"required"`
	Type       string  `json:"type" validate:"required"`
	DueDate    *string `json:"due_date,omitempty"`
	AssignedTo *string `json:"assigned_to,omitempty"`
	Notes      *string `json:"notes,omitempty"`
}

type UpdateContentRequest struct {
	Title      *string `json:"title,omitempty"`
	Type       *string `json:"type,omitempty"`
	DueDate    *string `json:"due_date,omitempty"`
	Status     *string `json:"status,omitempty"`
	AssignedTo *string `json:"assigned_to,omitempty"`
	Notes      *string `json:"notes,omitempty"`
}
