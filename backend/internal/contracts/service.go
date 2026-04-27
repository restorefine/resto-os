package contracts

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

func (s *Service) List(ctx context.Context, clientID string) ([]Contract, error) {
	return s.repo.List(ctx, clientID)
}

func (s *Service) Create(ctx context.Context, req CreateContractRequest, createdBy string) (*Contract, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}

	var startDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			return nil, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD")
		}
		startDate = &t
	}

	return s.repo.Create(ctx, req, createdBy, startDate)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
