package quotes

import (
	"encoding/json"
	"time"
)

type Quote struct {
	ID         string          `json:"id"`
	ClientID   string          `json:"client_id"`
	Reference  string          `json:"reference"`
	Items      json.RawMessage `json:"items"`
	Subtotal   float64         `json:"subtotal"`
	VAT        float64         `json:"vat"`
	Total      float64         `json:"total"`
	ValidUntil *time.Time      `json:"valid_until,omitempty"`
	Status     string          `json:"status"`
	CreatedBy  string          `json:"created_by"`
	CreatedAt  time.Time       `json:"created_at"`
}

type QuoteItem struct {
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
}

type CreateQuoteRequest struct {
	ClientID   string      `json:"client_id" validate:"required"`
	Items      []QuoteItem `json:"items" validate:"required,min=1"`
	VAT        float64     `json:"vat"`
	ValidUntil *string     `json:"valid_until,omitempty"`
}
