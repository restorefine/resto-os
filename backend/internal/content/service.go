package content

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

func (s *Service) List(ctx context.Context, clientID string) ([]ContentItem, error) {
	return s.repo.List(ctx, clientID)
}

func (s *Service) Create(ctx context.Context, req CreateContentRequest) (*ContentItem, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}

	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		t, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			// Try date-only format
			t, err = time.Parse("2006-01-02", *req.DueDate)
			if err != nil {
				return nil, fmt.Errorf("invalid due_date format")
			}
		}
		dueDate = &t
	}

	return s.repo.Create(ctx, req, dueDate)
}

func (s *Service) Update(ctx context.Context, id string, req UpdateContentRequest) (*ContentItem, error) {
	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		t, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			t, err = time.Parse("2006-01-02", *req.DueDate)
			if err != nil {
				return nil, fmt.Errorf("invalid due_date format")
			}
		}
		dueDate = &t
	}
	return s.repo.Update(ctx, id, req, dueDate)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
