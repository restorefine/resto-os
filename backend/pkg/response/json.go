package response

import (
	"encoding/json"
	"net/http"
)

type Success struct {
	Data    interface{} `json:"data"`
	Message string      `json:"message,omitempty"`
}

type Error struct {
	Error string `json:"error"`
	Code  string `json:"code,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func Ok(w http.ResponseWriter, data interface{}, message string) {
	JSON(w, http.StatusOK, Success{Data: data, Message: message})
}

func Created(w http.ResponseWriter, data interface{}, message string) {
	JSON(w, http.StatusCreated, Success{Data: data, Message: message})
}

func BadRequest(w http.ResponseWriter, err string, code string) {
	JSON(w, http.StatusBadRequest, Error{Error: err, Code: code})
}

func Unauthorized(w http.ResponseWriter, err string) {
	JSON(w, http.StatusUnauthorized, Error{Error: err, Code: "UNAUTHORIZED"})
}

func Forbidden(w http.ResponseWriter, err string) {
	JSON(w, http.StatusForbidden, Error{Error: err, Code: "FORBIDDEN"})
}

func NotFound(w http.ResponseWriter, err string) {
	JSON(w, http.StatusNotFound, Error{Error: err, Code: "NOT_FOUND"})
}

func InternalError(w http.ResponseWriter, err string) {
	JSON(w, http.StatusInternalServerError, Error{Error: err, Code: "INTERNAL_ERROR"})
}

func Conflict(w http.ResponseWriter, err string) {
	JSON(w, http.StatusConflict, Error{Error: err, Code: "CONFLICT"})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}
