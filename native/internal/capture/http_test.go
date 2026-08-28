package capture

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fixedAuthenticator struct {
	owner string
	err   error
}

func (a fixedAuthenticator) AuthenticateOwner(*http.Request) (string, error) {
	return a.owner, a.err
}

func TestHTTPHandlerCreatesOnlyForAuthenticatedOwner(t *testing.T) {
	writer := &recordingWriter{}
	service, err := NewService(writer, func() time.Time { return time.Unix(1, 0).UTC() }, func() string { return "memo-http-1" })
	if err != nil {
		t.Fatalf("new service: %v", err)
	}
	handler, err := NewHTTPHandler(service, fixedAuthenticator{owner: "owner-http"})
	if err != nil {
		t.Fatalf("new handler: %v", err)
	}

	request := httptest.NewRequest(http.MethodPost, BrowserCapturePath, strings.NewReader(`{"kind":"page","content":"Captured page","source_url":"https://example.test/a#fragment"}`))
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("status = %d body=%q", response.Code, response.Body.String())
	}
	if len(writer.created) != 1 || writer.created[0].OwnerID != "owner-http" {
		t.Fatalf("unexpected writes: %#v", writer.created)
	}
	if strings.Contains(writer.created[0].Content, "#fragment") {
		t.Fatalf("source fragment escaped privacy normalization: %q", writer.created[0].Content)
	}
}

func TestHTTPHandlerRejectsMissingAuthUnknownFieldsAndWrongPath(t *testing.T) {
	writer := &recordingWriter{}
	service, err := NewService(writer, time.Now, func() string { return "memo-http-1" })
	if err != nil {
		t.Fatalf("new service: %v", err)
	}

	unauthenticated, err := NewHTTPHandler(service, fixedAuthenticator{err: errors.New("no session")})
	if err != nil {
		t.Fatalf("new unauthenticated handler: %v", err)
	}
	response := httptest.NewRecorder()
	unauthenticated.ServeHTTP(response, httptest.NewRequest(http.MethodPost, BrowserCapturePath, strings.NewReader(`{"kind":"page","content":"x"}`)))
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status = %d", response.Code)
	}

	authenticated, err := NewHTTPHandler(service, fixedAuthenticator{owner: "owner"})
	if err != nil {
		t.Fatalf("new authenticated handler: %v", err)
	}
	response = httptest.NewRecorder()
	authenticated.ServeHTTP(response, httptest.NewRequest(http.MethodPost, BrowserCapturePath, strings.NewReader(`{"kind":"page","content":"x","unexpected":true}`)))
	if response.Code != http.StatusBadRequest {
		t.Fatalf("unknown-field status = %d", response.Code)
	}

	response = httptest.NewRecorder()
	authenticated.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/wrong", strings.NewReader(`{}`)))
	if response.Code != http.StatusNotFound {
		t.Fatalf("wrong-path status = %d", response.Code)
	}
	if len(writer.created) != 0 {
		t.Fatalf("rejected HTTP requests wrote memos: %#v", writer.created)
	}
}
