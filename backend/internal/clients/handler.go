package clients

import (
	"encoding/json"
	"log"
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
	log.Println("[clients] GET /api/clients")
	clients, err := h.svc.List(r.Context())
	if err != nil {
		log.Printf("[clients] List error: %v", err)
		response.InternalError(w, "failed to list clients")
		return
	}
	if clients == nil {
		clients = []Client{}
	}
	log.Printf("[clients] List → %d clients", len(clients))
	response.Ok(w, map[string]any{"clients": clients}, "")
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("[clients] GET /api/clients/%s", id)
	c, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		log.Printf("[clients] GetByID %s error: %v", id, err)
		response.NotFound(w, "client not found")
		return
	}
	response.Ok(w, map[string]any{"client": c}, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	log.Println("[clients] POST /api/clients")
	var req CreateClientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[clients] Create decode error: %v", err)
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	log.Printf("[clients] Create request: name=%q package=%q email=%v monthly_value=%v invoice_day=%v",
		req.Name, req.Package, req.ContactEmail, req.MonthlyValue, req.InvoiceDay)
	c, err := h.svc.Create(r.Context(), req)
	if err != nil {
		log.Printf("[clients] Create error: %v", err)
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	log.Printf("[clients] Created client id=%s name=%q", c.ID, c.Name)
	response.Created(w, map[string]any{"client": c}, "client created")
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("[clients] PATCH /api/clients/%s", id)
	var req UpdateClientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[clients] Update decode error: %v", err)
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	c, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		log.Printf("[clients] Update %s error: %v", id, err)
		response.InternalError(w, "failed to update client")
		return
	}
	response.Ok(w, map[string]any{"client": c}, "client updated")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("[clients] DELETE /api/clients/%s", id)
	if err := h.svc.Delete(r.Context(), id); err != nil {
		log.Printf("[clients] Delete %s error: %v", id, err)
		response.InternalError(w, "failed to delete client")
		return
	}
	response.Ok(w, nil, "client deleted")
}

func (h *Handler) ActivatePortal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("[clients] POST /api/clients/%s/activate-portal", id)
	if err := h.svc.ActivatePortal(r.Context(), id, h.mailer, h.hub); err != nil {
		log.Printf("[clients] ActivatePortal %s error: %v", id, err)
		response.BadRequest(w, err.Error(), "ACTIVATION_ERROR")
		return
	}
	response.Ok(w, nil, "portal activated")
}
