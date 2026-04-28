package pipeline

import (
	"encoding/json"
	"log"
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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.List(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list pipeline")
		return
	}
	if list == nil {
		list = []Lead{}
	}
	response.Ok(w, map[string]any{"leads": list}, "")
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	lead, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, "lead not found")
		return
	}
	response.Ok(w, map[string]any{"lead": lead}, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	log.Println("[pipeline] POST /api/pipeline")
	var req CreateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[pipeline] decode error: %v", err)
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	log.Printf("[pipeline] Create: company=%q stage=%q assigned_to=%v value=%v",
		req.CompanyName, req.Stage, req.AssignedTo, req.Value)
	lead, err := h.svc.Create(r.Context(), req)
	if err != nil {
		log.Printf("[pipeline] Create error: %v", err)
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	log.Printf("[pipeline] Created lead id=%s company=%q", lead.ID, lead.CompanyName)
	response.Created(w, map[string]any{"lead": lead}, "lead created")
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	lead, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		response.InternalError(w, "failed to update lead")
		return
	}
	response.Ok(w, map[string]any{"lead": lead}, "lead updated")
}

func (h *Handler) Move(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req MoveLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	lead, err := h.svc.Move(r.Context(), id, req)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Ok(w, map[string]any{"lead": lead}, "lead moved")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete lead")
		return
	}
	response.Ok(w, nil, "lead deleted")
}
