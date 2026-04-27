package pipeline

import "time"

type Lead struct {
	ID          string     `json:"id"`
	CompanyName string     `json:"company_name"`
	ContactName *string    `json:"contact_name,omitempty"`
	ContactEmail *string   `json:"contact_email,omitempty"`
	Value       *float64   `json:"value,omitempty"`
	Stage       string     `json:"stage"`
	NextAction  *string    `json:"next_action,omitempty"`
	Notes       *string    `json:"notes,omitempty"`
	AssignedTo  *string    `json:"assigned_to,omitempty"`
	Position    int        `json:"position"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateLeadRequest struct {
	CompanyName  string   `json:"company_name" validate:"required"`
	ContactName  *string  `json:"contact_name,omitempty"`
	ContactEmail *string  `json:"contact_email,omitempty"`
	Value        *float64 `json:"value,omitempty"`
	Stage        string   `json:"stage"`
	NextAction   *string  `json:"next_action,omitempty"`
	Notes        *string  `json:"notes,omitempty"`
	AssignedTo   *string  `json:"assigned_to,omitempty"`
}

type UpdateLeadRequest struct {
	CompanyName  *string  `json:"company_name,omitempty"`
	ContactName  *string  `json:"contact_name,omitempty"`
	ContactEmail *string  `json:"contact_email,omitempty"`
	Value        *float64 `json:"value,omitempty"`
	Stage        *string  `json:"stage,omitempty"`
	NextAction   *string  `json:"next_action,omitempty"`
	Notes        *string  `json:"notes,omitempty"`
	AssignedTo   *string  `json:"assigned_to,omitempty"`
}

type MoveLeadRequest struct {
	Stage    string `json:"stage" validate:"required"`
	Position int    `json:"position"`
}
