package clients

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/restorefine/agencyos/pkg/mailer"
	"github.com/restorefine/agencyos/pkg/response"
	"github.com/restorefine/agencyos/pkg/stream"
)

type Handler struct {
	svc    *Service
	mailer *mailer.Mailer
	hub    *stream.Hub
}

func NewHandler(svc *Service, m *mailer.Mailer, hub *stream.Hub) *Handler {
	return &Handler{svc: svc, mailer: m, hub: hub}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	clients, err := h.svc.List(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list clients")
		return
	}
	if clients == nil {
		clients = []Client{}
	}
	response.Ok(w, clients, "")
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	c, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, "client not found")
		return
	}
	response.Ok(w, c, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateClientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	c, err := h.svc.Create(r.Context(), req)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Created(w, c, "client created")
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateClientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	c, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		response.InternalError(w, "failed to update client")
		return
	}
	response.Ok(w, c, "client updated")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete client")
		return
	}
	response.Ok(w, nil, "client deleted")
}

func (h *Handler) ActivatePortal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.ActivatePortal(r.Context(), id, h.mailer, h.hub); err != nil {
		response.BadRequest(w, err.Error(), "ACTIVATION_ERROR")
		return
	}
	response.Ok(w, nil, "portal activated")
}
