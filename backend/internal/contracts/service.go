package contracts

import (
	"context"
	"crypto/rand"
	"encoding/hex"
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

// ─── Existing contract methods ────────────────────────────────────────────────

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

// ─── Contract link methods ────────────────────────────────────────────────────

func (s *Service) ShareContract(ctx context.Context, data ContractLinkData, createdBy string) (*ContractLink, error) {
	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	return s.repo.CreateContractLink(ctx, token, data, createdBy, expiresAt)
}

func (s *Service) GetContractByToken(ctx context.Context, token string) (*ContractLink, error) {
	return s.repo.GetContractLinkByToken(ctx, token)
}

func (s *Service) SignContract(ctx context.Context, token, signature string) (*ContractLink, error) {
	link, err := s.repo.GetContractLinkByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("contract not found")
	}
	if link.SignedAt != nil {
		return nil, fmt.Errorf("contract already signed")
	}
	if time.Now().After(link.ExpiresAt) {
		return nil, fmt.Errorf("this link has expired")
	}
	signedAt := time.Now()
	if err := s.repo.SignContractLink(ctx, token, signature, signedAt); err != nil {
		return nil, err
	}
	link.ClientSignature = &signature
	link.SignedAt = &signedAt
	link.Status = "signed"
	return link, nil
}

func (s *Service) ListContractLinks(ctx context.Context) ([]ContractLink, error) {
	links, err := s.repo.ListContractLinks(ctx)
	if links == nil {
		links = []ContractLink{}
	}
	return links, err
}

func (s *Service) DeleteContractLink(ctx context.Context, id string) error {
	return s.repo.DeleteContractLink(ctx, id)
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
