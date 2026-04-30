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

// ─── Existing handlers ────────────────────────────────────────────────────────

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

// ─── Contract link handlers ───────────────────────────────────────────────────

func (h *Handler) ShareContract(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req ShareContractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	if req.ContractData.ClientName == "" || req.ContractData.StartDate == "" {
		response.BadRequest(w, "clientName and startDate are required", "VALIDATION_ERROR")
		return
	}

	link, err := h.svc.ShareContract(r.Context(), req.ContractData, claims.UserID)
	if err != nil {
		response.InternalError(w, "failed to create share link")
		return
	}
	response.Ok(w, link, "contract link created")
}

// GET /api/contracts/public/:token — no auth required
func (h *Handler) GetPublicContract(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	link, err := h.svc.GetContractByToken(r.Context(), token)
	if err != nil {
		response.NotFound(w, "contract not found")
		return
	}
	response.Ok(w, link, "")
}

// POST /api/contracts/public/:token/sign — no auth required
func (h *Handler) SignContract(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")

	var req SignContractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	if req.Signature == "" {
		response.BadRequest(w, "signature is required", "VALIDATION_ERROR")
		return
	}

	link, err := h.svc.SignContract(r.Context(), token, req.Signature)
	if err != nil {
		response.BadRequest(w, err.Error(), "SIGN_ERROR")
		return
	}
	response.Ok(w, link, "contract signed successfully")
}

func (h *Handler) ListLinks(w http.ResponseWriter, r *http.Request) {
	links, err := h.svc.ListContractLinks(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list contract links")
		return
	}
	response.Ok(w, links, "")
}

func (h *Handler) DeleteLink(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteContractLink(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete link")
		return
	}
	response.Ok(w, nil, "link deleted")
}
