package content

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
		response.InternalError(w, "failed to list content")
		return
	}
	if list == nil {
		list = []ContentItem{}
	}
	response.Ok(w, list, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	item, err := h.svc.Create(r.Context(), req)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Created(w, item, "content item created")
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	item, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		response.InternalError(w, "failed to update content item")
		return
	}
	response.Ok(w, item, "content item updated")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete content item")
		return
	}
	response.Ok(w, nil, "content item deleted")
}
