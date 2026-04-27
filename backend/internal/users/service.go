package users

import (
	"context"
	"fmt"

	"github.com/go-playground/validator/v10"
	"github.com/restorefine/agencyos/internal/auth"
)

type Service struct {
	repo      *Repository
	validate  *validator.Validate
}

func NewService(repo *Repository) *Service {
	return &Service{
		repo:     repo,
		validate: validator.New(),
	}
}

func (s *Service) List(ctx context.Context) ([]User, error) {
	return s.repo.List(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	return s.repo.Create(ctx, req.Name, req.Email, hash, req.Role, req.ClientID)
}

func (s *Service) Update(ctx context.Context, id string, req UpdateUserRequest) (*User, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *Service) SeedAdminUsers(ctx context.Context) error {
	seed := []struct{ name, email, role string }{
		{"Rohit", "rohit@restorefine.co.uk", "admin"},
		{"Rohin", "rohin@restorefine.co.uk", "staff"},
		{"Harpreet", "harpreet@restorefine.co.uk", "staff"},
		{"Arpan", "arpan@restorefine.co.uk", "video_editor"},
		{"Prabish", "prabish@restorefine.co.uk", "developer_designer"},
		{"Kreshina", "kreshina@restorefine.co.uk", "project_manager"},
	}

	for _, u := range seed {
		hash, err := auth.HashPassword("12345678")
		if err != nil {
			return fmt.Errorf("hash for %s: %w", u.email, err)
		}
		if err := s.repo.UpsertSeedUser(ctx, u.name, u.email, hash, u.role); err != nil {
			return fmt.Errorf("upsert %s: %w", u.email, err)
		}
	}
	return nil
}
