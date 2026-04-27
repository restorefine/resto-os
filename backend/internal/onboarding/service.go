package onboarding

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetByClient(ctx context.Context, clientID string) ([]Step, error) {
	return s.repo.GetByClient(ctx, clientID)
}

func (s *Service) ToggleStep(ctx context.Context, stepID string, completed bool) (*Step, error) {
	return s.repo.ToggleStep(ctx, stepID, completed)
}

func (s *Service) EnsureDefaultSteps(ctx context.Context, clientID string) error {
	return s.repo.EnsureDefaultSteps(ctx, clientID)
}
