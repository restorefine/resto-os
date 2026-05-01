package videochat

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/pkg/response"
	"github.com/restorefine/agencyos/pkg/stream"
)

var allowedChatters = map[string]bool{
	"rohit": true, "rohin": true, "harpreet": true, "kreshina": true, "prabish": true, "arpan": true,
}

type Handler struct {
	repo *Repository
	hub  *stream.Hub
	db   *pgxpool.Pool
}

func NewHandler(repo *Repository, hub *stream.Hub, db *pgxpool.Pool) *Handler {
	return &Handler{repo: repo, hub: hub, db: db}
}

// resolveAuthorName returns the user's display name from the JWT claim if present,
// otherwise falls back to a DB lookup by user ID. This handles old tokens that
// predate the Name field being added to claims.
func (h *Handler) resolveAuthorName(claims *auth.Claims) (string, error) {
	if strings.TrimSpace(claims.Name) != "" {
		return claims.Name, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var name string
	err := h.db.QueryRow(ctx, `SELECT name FROM users WHERE id = $1`, claims.UserID).Scan(&name)
	return name, err
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "id")
	list, err := h.repo.List(r.Context(), videoID)
	if err != nil {
		response.InternalError(w, "failed to list messages")
		return
	}
	if list == nil {
		list = []Message{}
	}
	response.Ok(w, map[string]any{"messages": list}, "")
}

func (h *Handler) Send(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "id")
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	authorName, err := h.resolveAuthorName(claims)
	if err != nil || authorName == "" {
		response.Forbidden(w, "could not resolve user identity")
		return
	}

	firstWord := strings.ToLower(strings.SplitN(authorName, " ", 2)[0])
	if !allowedChatters[firstWord] {
		response.Forbidden(w, "not authorised to chat")
		return
	}

	var req SendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		response.BadRequest(w, "message required", "BAD_REQUEST")
		return
	}

	msg, err := h.repo.Create(r.Context(), videoID, authorName, strings.TrimSpace(req.Message))
	if err != nil {
		response.InternalError(w, "failed to send message")
		return
	}

	b, _ := json.Marshal(msg)
	h.hub.Broadcast("chat_message", string(b))

	response.Created(w, map[string]any{"message": msg}, "")
}

func (h *Handler) Typing(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "id")
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	authorName, _ := h.resolveAuthorName(claims)
	if authorName == "" {
		authorName = claims.Email
	}

	b, _ := json.Marshal(map[string]string{"video_id": videoID, "author": authorName})
	h.hub.Broadcast("chat_typing", string(b))
	fmt.Fprint(w, "ok")
}
