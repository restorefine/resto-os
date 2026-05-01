package onboarding

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/restorefine/agencyos/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	steps, err := h.svc.GetAll(r.Context())
	if err != nil {
		response.InternalError(w, "failed to get onboarding steps")
		return
	}
	if steps == nil {
		steps = []Step{}
	}
	response.Ok(w, steps, "")
}

func (h *Handler) GetByClient(w http.ResponseWriter, r *http.Request) {
	clientID := chi.URLParam(r, "clientId")
	// Auto-create default steps if none exist yet (idempotent)
	if err := h.svc.EnsureDefaultSteps(r.Context(), clientID); err != nil {
		response.InternalError(w, "failed to initialise onboarding steps")
		return
	}
	steps, err := h.svc.GetByClient(r.Context(), clientID)
	if err != nil {
		response.InternalError(w, "failed to get onboarding steps")
		return
	}
	if steps == nil {
		steps = []Step{}
	}
	response.Ok(w, steps, "")
}

type toggleRequest struct {
	Completed bool `json:"completed"`
}

func (h *Handler) ToggleStep(w http.ResponseWriter, r *http.Request) {
	stepID := chi.URLParam(r, "stepId")
	var req toggleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	step, err := h.svc.ToggleStep(r.Context(), stepID, req.Completed)
	if err != nil {
		response.InternalError(w, "failed to update step")
		return
	}
	response.Ok(w, step, "step updated")
}
