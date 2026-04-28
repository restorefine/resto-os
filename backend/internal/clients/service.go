package clients

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/pkg/mailer"
	"github.com/restorefine/agencyos/pkg/stream"
)

type Service struct {
	repo     *Repository
	validate *validator.Validate
	usersDB  usersCreator
}

// usersCreator is a minimal interface so we don't import the full users package
type usersCreator interface {
	CreateClientUser(ctx context.Context, email, name, passwordHash, clientID string) error
}

func NewService(repo *Repository, usersDB usersCreator) *Service {
	return &Service{
		repo:     repo,
		validate: validator.New(),
		usersDB:  usersDB,
	}
}

func (s *Service) List(ctx context.Context) ([]Client, error) {
	return s.repo.List(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Client, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, req CreateClientRequest) (*Client, error) {
	log.Printf("[clients/svc] Create: name=%q package=%q", req.Name, req.Package)
	if err := s.validate.Struct(req); err != nil {
		log.Printf("[clients/svc] validation failed: %v", err)
		return nil, fmt.Errorf("validation: %w", err)
	}
	c, err := s.repo.Create(ctx, req)
	if err != nil {
		log.Printf("[clients/svc] repo.Create error: %v", err)
		return nil, err
	}
	log.Printf("[clients/svc] repo.Create OK → id=%s", c.ID)
	return c, nil
}

func (s *Service) Update(ctx context.Context, id string, req UpdateClientRequest) (*Client, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *Service) ActivatePortal(ctx context.Context, clientID string, m *mailer.Mailer, hub *stream.Hub) error {
	// Check all onboarding steps complete
	done, err := s.repo.AllOnboardingComplete(ctx, clientID)
	if err != nil {
		return fmt.Errorf("onboarding check: %w", err)
	}
	if !done {
		return fmt.Errorf("not all onboarding steps are complete")
	}

	client, err := s.repo.GetByID(ctx, clientID)
	if err != nil {
		return fmt.Errorf("client not found: %w", err)
	}

	// Generate 12-char temp password
	tempPassword, err := generateTempPassword(12)
	if err != nil {
		return fmt.Errorf("generate password: %w", err)
	}

	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	email := ""
	name := client.Name
	if client.ContactEmail != nil {
		email = *client.ContactEmail
	}
	if client.ContactName != nil {
		name = *client.ContactName
	}
	if email == "" {
		return fmt.Errorf("client has no contact email")
	}

	// Create user with role=client
	if err := s.usersDB.CreateClientUser(ctx, email, name, hash, clientID); err != nil {
		return fmt.Errorf("create client user: %w", err)
	}

	// Send welcome email
	if err := m.SendPortalWelcome(email, name, tempPassword); err != nil {
		// Non-fatal – log but don't abort
		fmt.Printf("[WARN] failed to send welcome email: %v\n", err)
	}

	// Mark portal activated
	if err := s.repo.SetPortalActivated(ctx, clientID); err != nil {
		return fmt.Errorf("set portal activated: %w", err)
	}

	// Broadcast SSE
	hub.Broadcast("portal_activated", fmt.Sprintf(`{"client_id":"%s"}`, clientID))

	return nil
}

func generateTempPassword(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	sb := strings.Builder{}
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		sb.WriteByte(charset[n.Int64()])
	}
	return sb.String(), nil
}
