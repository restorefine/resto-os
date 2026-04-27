package videos

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

func (s *Service) List(ctx context.Context, clientID string) ([]Video, error) {
	return s.repo.List(ctx, clientID)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Video, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, req CreateVideoRequest, uploadedBy string) (*Video, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}

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

	return s.repo.Create(ctx, req, uploadedBy, dueDate)
}

func (s *Service) Update(ctx context.Context, id string, req UpdateVideoRequest) (*Video, error) {
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

func (s *Service) Approve(ctx context.Context, id, approverID string) (*Video, error) {
	return s.repo.Approve(ctx, id, approverID)
}

func (s *Service) RequestEdit(ctx context.Context, id, feedback string) (*Video, error) {
	return s.repo.RequestEdit(ctx, id, feedback)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *Service) ListComments(ctx context.Context, videoID string) ([]Comment, error) {
	return s.repo.ListComments(ctx, videoID)
}

func (s *Service) AddComment(ctx context.Context, videoID, authorID, authorName, role string, req AddCommentRequest) (*Comment, error) {
	if err := s.validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation: %w", err)
	}
	return s.repo.AddComment(ctx, videoID, authorID, authorName, role, req)
}
