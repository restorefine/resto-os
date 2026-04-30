package contracts

import "time"

// ─── Existing contract types ──────────────────────────────────────────────────

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

// ─── Contract link types ──────────────────────────────────────────────────────

type ContractLinkData struct {
	ClientID        string  `json:"clientId"`
	ClientName      string  `json:"clientName"`
	ClientCompany   string  `json:"clientCompany"`
	ClientAddress   string  `json:"clientAddress"`
	ClientPhone     string  `json:"clientPhone"`
	StartDate       string  `json:"startDate"`
	VideoCount      int     `json:"videoCount"`
	PhotoCount      int     `json:"photoCount"`
	TotalInvestment float64 `json:"totalInvestment"`
	Payment1        float64 `json:"payment1"`
	Payment2        float64 `json:"payment2"`
}

type ContractLink struct {
	ID              string           `json:"id"`
	Token           string           `json:"token"`
	ContractData    ContractLinkData `json:"contractData"`
	ClientName      string           `json:"clientName"`
	ClientCompany   string           `json:"clientCompany"`
	ClientSignature *string          `json:"clientSignature,omitempty"`
	SignedAt        *time.Time       `json:"signedAt,omitempty"`
	ExpiresAt       time.Time        `json:"expiresAt"`
	CreatedBy       string           `json:"createdBy"`
	CreatedAt       time.Time        `json:"createdAt"`
	Status          string           `json:"status"`
}

func (l *ContractLink) computeStatus() string {
	if l.SignedAt != nil {
		return "signed"
	}
	if time.Now().After(l.ExpiresAt) {
		return "expired"
	}
	return "pending"
}

type ShareContractRequest struct {
	ContractData ContractLinkData `json:"contractData"`
}

type SignContractRequest struct {
	Signature string `json:"signature"`
}
