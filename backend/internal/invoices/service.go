package invoices

import (
	"context"
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

func (s *Service) List(ctx context.Context, clientID string) ([]Invoice, error) {
	return s.repo.List(ctx, clientID)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Invoice, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, req CreateInvoiceRequest) (*Invoice, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}

	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return nil, fmt.Errorf("invalid due_date format, expected YYYY-MM-DD")
	}

	year := time.Now().Year()
	count, err := s.repo.CountByYear(ctx, year)
	if err != nil {
		return nil, fmt.Errorf("count invoices: %w", err)
	}
	reference := fmt.Sprintf("INV-%d-%03d", year, count+1)

	return s.repo.Create(ctx, req.ClientID, reference, req.Amount, dueDate)
}

func (s *Service) MarkPaid(ctx context.Context, id string) (*Invoice, error) {
	return s.repo.MarkPaid(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
