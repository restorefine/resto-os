package quotes

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
)

type Service struct {
	repo     *Repository
	validate *validator.Validate
}

func NewService(repo *Repository) *Service {
	return &Service{
		repo:     repo,
		validate: validator.New(),
	}
}

func (s *Service) List(ctx context.Context, clientID string) ([]Quote, error) {
	return s.repo.List(ctx, clientID)
}

func (s *Service) Create(ctx context.Context, req CreateQuoteRequest, createdBy string) (*Quote, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}

	var subtotal float64
	for _, item := range req.Items {
		subtotal += float64(item.Quantity) * item.UnitPrice
	}
	total := subtotal + req.VAT

	itemsJSON, err := json.Marshal(req.Items)
	if err != nil {
		return nil, fmt.Errorf("marshal items: %w", err)
	}

	year := time.Now().Year()
	count, err := s.repo.CountByYear(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("count quotes: %w", err)
	}
	reference := fmt.Sprintf("QUO-%d-%03d", year, count+1)

	var validUntil *time.Time
	if req.ValidUntil != nil && *req.ValidUntil != "" {
		t, err := time.Parse("2006-01-02", *req.ValidUntil)
		if err != nil {
			return nil, fmt.Errorf("invalid valid_until format, expected YYYY-MM-DD")
		}
		validUntil = &t
	}

	return s.repo.Create(ctx, req.ClientID, reference, createdBy, itemsJSON, subtotal, req.VAT, total, validUntil)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
