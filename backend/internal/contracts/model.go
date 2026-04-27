package contracts

import "time"

type Contract struct {
	ID             string     `json:"id"`
	ClientID       string     `json:"client_id"`
	Package        string     `json:"package"`
	StartDate      *time.Time `json:"start_date,omitempty"`
	DurationMonths *int       `json:"duration_months,omitempty"`
	SpecialTerms   *string    `json:"special_terms,omitempty"`
	Status         string     `json:"status"`
	CreatedBy      string     `json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CreateContractRequest struct {
	ClientID       string  `json:"client_id" validate:"required"`
	Package        string  `json:"package" validate:"required"`
	StartDate      *string `json:"start_date,omitempty"`
	DurationMonths *int    `json:"duration_months,omitempty"`
	SpecialTerms   *string `json:"special_terms,omitempty"`
}
