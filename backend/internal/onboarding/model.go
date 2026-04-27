package onboarding

import "time"

type Step struct {
	ID          string     `json:"id"`
	ClientID    string     `json:"client_id"`
	Step        string     `json:"step"`
	Completed   bool       `json:"completed"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}
