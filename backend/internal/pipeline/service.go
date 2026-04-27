package pipeline

import (
	"context"
	"fmt"

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

func (s *Service) List(ctx context.Context) ([]Lead, error) {
	return s.repo.List(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Lead, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, req CreateLeadRequest) (*Lead, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}
	return s.repo.Create(ctx, req)
}

func (s *Service) Update(ctx context.Context, id string, req UpdateLeadRequest) (*Lead, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Move(ctx context.Context, id string, req MoveLeadRequest) (*Lead, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}
	return s.repo.Move(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
