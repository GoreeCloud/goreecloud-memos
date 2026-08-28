package capture

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

const BrowserCapturePath = "/v1/capture/browser"

type OwnerAuthenticator interface {
	AuthenticateOwner(*http.Request) (string, error)
}

type HTTPHandler struct {
	service       *Service
	authenticator OwnerAuthenticator
}

func NewHTTPHandler(service *Service, authenticator OwnerAuthenticator) (*HTTPHandler, error) {
	if service == nil {
		return nil, errors.New("capture service is required")
	}
	if authenticator == nil {
		return nil, errors.New("owner authenticator is required")
	}
	return &HTTPHandler{service: service, authenticator: authenticator}, nil
}

type captureRequest struct {
	Kind      Kind   `json:"kind"`
	Content   string `json:"content"`
	SourceURL string `json:"source_url"`
}

type captureResponse struct {
	MemoID string `json:"memo_id"`
}

func (h *HTTPHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost || r.URL.Path != BrowserCapturePath {
		http.NotFound(w, r)
		return
	}
	ownerID, err := h.authenticator.AuthenticateOwner(r)
	if err != nil || strings.TrimSpace(ownerID) == "" {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, MaxContentBytes+MaxSourceURLBytes+4096)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var request captureRequest
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "invalid capture request", http.StatusBadRequest)
		return
	}
	var extra any
	if err := decoder.Decode(&extra); err == nil {
		http.Error(w, "invalid capture request", http.StatusBadRequest)
		return
	}

	created, err := h.service.Capture(r.Context(), ownerID, Input{
		Kind:      request.Kind,
		Content:   request.Content,
		SourceURL: request.SourceURL,
	})
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, ErrUnauthenticated) {
			status = http.StatusUnauthorized
		}
		http.Error(w, "capture rejected", status)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(captureResponse{MemoID: created.ID})
}
