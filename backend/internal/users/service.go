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
	count, err := s.repo.CountUsers(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	// Create admin
	_, err = s.Create(ctx, CreateUserRequest{
		Name:     "Rohit Admin",
		Email:    "admin@restorefine.co.uk",
		Password: "Admin123!",
		Role:     "admin",
	})
	if err != nil {
		return fmt.Errorf("seed admin: %w", err)
	}

	// Create staff
	_, err = s.Create(ctx, CreateUserRequest{
		Name:     "Rohit",
		Email:    "rohit@restorefine.co.uk",
		Password: "Staff123!",
		Role:     "staff",
	})
	if err != nil {
		return fmt.Errorf("seed staff: %w", err)
	}

	return nil
}
