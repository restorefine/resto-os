package contracts

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	clientID := r.URL.Query().Get("client_id")
	list, err := h.svc.List(r.Context(), clientID)
	if err != nil {
		response.InternalError(w, "failed to list contracts")
		return
	}
	if list == nil {
		list = []Contract{}
	}
	response.Ok(w, list, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req CreateContractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	c, err := h.svc.Create(r.Context(), req, claims.UserID)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Created(w, c, "contract created")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete contract")
		return
	}
	response.Ok(w, nil, "contract deleted")
}
