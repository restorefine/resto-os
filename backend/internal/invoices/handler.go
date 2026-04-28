package invoices

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	clientID := r.URL.Query().Get("client_id")
	list, err := h.svc.List(r.Context(), clientID)
	if err != nil {
		response.InternalError(w, "failed to list invoices")
		return
	}
	if list == nil {
		list = []Invoice{}
	}
	response.Ok(w, map[string]any{"invoices": list}, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	inv, err := h.svc.Create(r.Context(), req)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Created(w, map[string]any{"invoice": inv}, "invoice created")
}

func (h *Handler) MarkPaid(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	inv, err := h.svc.MarkPaid(r.Context(), id)
	if err != nil {
		response.InternalError(w, "failed to mark invoice as paid")
		return
	}
	response.Ok(w, map[string]any{"invoice": inv}, "invoice marked as paid")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete invoice")
		return
	}
	response.Ok(w, nil, "invoice deleted")
}
