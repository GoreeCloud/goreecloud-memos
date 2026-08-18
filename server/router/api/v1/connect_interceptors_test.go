package v1

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"strings"
	"testing"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/emptypb"
)

func TestMetadataInterceptorForwardsSecurityHeaders(t *testing.T) {
	interceptor := NewMetadataInterceptor()
	req := connect.NewRequest(&emptypb.Empty{})
	req.Header().Set("Origin", "https://memos.example")
	req.Header().Set("X-Forwarded-Proto", "https")
	req.Header().Set("Forwarded", "for=203.0.113.1;proto=https")

	handler := interceptor.WrapUnary(func(ctx context.Context, _ connect.AnyRequest) (connect.AnyResponse, error) {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			t.Fatal("expected metadata in context")
		}
		if got := md.Get("origin"); len(got) != 1 || got[0] != "https://memos.example" {
			t.Fatalf("unexpected origin metadata: %v", got)
		}
		if got := md.Get("x-forwarded-proto"); len(got) != 1 || got[0] != "https" {
			t.Fatalf("unexpected x-forwarded-proto metadata: %v", got)
		}
		if got := md.Get("forwarded"); len(got) != 1 || got[0] != "for=203.0.113.1;proto=https" {
			t.Fatalf("unexpected forwarded metadata: %v", got)
		}
		return connect.NewResponse(&emptypb.Empty{}), nil
	})

	if _, err := handler(context.Background(), req); err != nil {
		t.Fatalf("metadata interceptor returned error: %v", err)
	}
}

func TestLoggingInterceptorClassifiesStructuredOutcomes(t *testing.T) {
	interceptor := NewLoggingInterceptor(false)

	level, message, code := interceptor.classifyError(nil)
	if level != slog.LevelInfo || message != "RPC request completed" || code != connect.CodeOK.String() {
		t.Fatalf("unexpected success classification: level=%v message=%q code=%q", level, message, code)
	}

	level, message, code = interceptor.classifyError(connect.NewError(connect.CodePermissionDenied, errors.New("denied")))
	if level != slog.LevelInfo || message != "RPC request rejected" || code != connect.CodePermissionDenied.String() {
		t.Fatalf("unexpected client-error classification: level=%v message=%q code=%q", level, message, code)
	}

	level, message, code = interceptor.classifyError(connect.NewError(connect.CodeInternal, errors.New("database failed")))
	if level != slog.LevelError || message != "RPC request failed" || code != connect.CodeInternal.String() {
		t.Fatalf("unexpected server-error classification: level=%v message=%q code=%q", level, message, code)
	}
}

func TestLoggingInterceptorOmitsExpectedClientErrorText(t *testing.T) {
	var output bytes.Buffer
	previousLogger := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&output, nil)))
	t.Cleanup(func() { slog.SetDefault(previousLogger) })

	interceptor := NewLoggingInterceptor(false)
	interceptor.log(
		context.Background(),
		"/memos.api.v1.AuthService/SignIn",
		connect.NewError(connect.CodeInvalidArgument, errors.New("private-user-provided-value")),
		1500*time.Millisecond,
	)

	logged := output.String()
	for _, expected := range []string{
		"transport=connect",
		"method=/memos.api.v1.AuthService/SignIn",
		"outcome=error",
		"rpc_code=invalid_argument",
		"duration_ms=1500",
	} {
		if !strings.Contains(logged, expected) {
			t.Fatalf("structured log missing %q: %s", expected, logged)
		}
	}
	if strings.Contains(logged, "private-user-provided-value") {
		t.Fatalf("expected client error text to be omitted from structured logs: %s", logged)
	}
}
