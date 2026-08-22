package v1

import (
	"context"
	"fmt"
	"log/slog"
	"reflect"
	"runtime/debug"
	"time"

	"connectrpc.com/connect"
	pkgerrors "github.com/pkg/errors"
	"google.golang.org/grpc/metadata"

	"github.com/usememos/memos/server/auth"
)

// MetadataInterceptor converts Connect HTTP headers to gRPC metadata.
//
// This ensures service methods can use metadata.FromIncomingContext() to access
// headers like User-Agent, X-Forwarded-For, etc., regardless of whether the
// request came via Connect RPC or gRPC-Gateway.
type MetadataInterceptor struct{}

// NewMetadataInterceptor creates a new metadata interceptor.
func NewMetadataInterceptor() *MetadataInterceptor {
	return &MetadataInterceptor{}
}

func (*MetadataInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		header := req.Header()
		md := metadata.MD{}

		// Forward only headers consumed by security/session logic. Logging does
		// not emit these values, keeping IP addresses, cookies and user agents out
		// of normal request telemetry.
		if ua := header.Get("User-Agent"); ua != "" {
			md.Set("user-agent", ua)
		}
		if origin := header.Get("Origin"); origin != "" {
			md.Set("origin", origin)
		}
		if xff := header.Get("X-Forwarded-For"); xff != "" {
			md.Set("x-forwarded-for", xff)
		}
		if xfp := header.Get("X-Forwarded-Proto"); xfp != "" {
			md.Set("x-forwarded-proto", xfp)
		}
		if xri := header.Get("X-Real-Ip"); xri != "" {
			md.Set("x-real-ip", xri)
		}
		if forwarded := header.Get("Forwarded"); forwarded != "" {
			md.Set("forwarded", forwarded)
		}
		if cookie := header.Get("Cookie"); cookie != "" {
			md.Set("cookie", cookie)
		}

		ctx = metadata.NewIncomingContext(ctx, md)
		resp, err := next(ctx, req)

		// Prevent browser caching of API responses to avoid stale data issues.
		if !isNilAnyResponse(resp) && resp.Header() != nil {
			resp.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			resp.Header().Set("Pragma", "no-cache")
			resp.Header().Set("Expires", "0")
		}

		return resp, err
	}
}

func isNilAnyResponse(resp connect.AnyResponse) bool {
	if resp == nil {
		return true
	}
	val := reflect.ValueOf(resp)
	return val.Kind() == reflect.Pointer && val.IsNil()
}

func (*MetadataInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (*MetadataInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}

// LoggingInterceptor emits bounded structured telemetry for Connect RPC calls.
// It intentionally avoids request bodies, headers, cookies, user agents and IP
// addresses. Expected client errors are classified without logging their text,
// which may contain user-provided values. Server errors retain an error message
// for troubleshooting; full stack traces remain Demo-only.
type LoggingInterceptor struct {
	logStacktrace bool
}

// NewLoggingInterceptor creates a new logging interceptor.
func NewLoggingInterceptor(logStacktrace bool) *LoggingInterceptor {
	return &LoggingInterceptor{logStacktrace: logStacktrace}
}

func (in *LoggingInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		startedAt := time.Now()
		resp, err := next(ctx, req)
		in.log(ctx, req.Spec().Procedure, err, time.Since(startedAt))
		return resp, err
	}
}

func (*LoggingInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (*LoggingInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}

func (in *LoggingInterceptor) log(ctx context.Context, procedure string, err error, duration time.Duration) {
	level, msg, rpcCode := in.classifyError(err)
	outcome := "success"
	if err != nil {
		outcome = "error"
	}
	attrs := []slog.Attr{
		slog.String("transport", "connect"),
		slog.String("method", procedure),
		slog.String("outcome", outcome),
		slog.String("rpc_code", rpcCode),
		slog.Int64("duration_ms", duration.Milliseconds()),
	}
	if err != nil && level >= slog.LevelError {
		attrs = append(attrs, slog.String("error", err.Error()))
	}
	if err != nil && in.logStacktrace {
		attrs = append(attrs, slog.String("stacktrace", fmt.Sprintf("%+v", err)))
	}
	slog.LogAttrs(ctx, level, msg, attrs...)
}

func (*LoggingInterceptor) classifyError(err error) (slog.Level, string, string) {
	if err == nil {
		return slog.LevelInfo, "RPC request completed", "ok"
	}

	var connectErr *connect.Error
	if !pkgerrors.As(err, &connectErr) {
		return slog.LevelError, "RPC request failed", "unknown"
	}

	code := connectErr.Code()
	switch code {
	case connect.CodeCanceled,
		connect.CodeInvalidArgument,
		connect.CodeNotFound,
		connect.CodeAlreadyExists,
		connect.CodePermissionDenied,
		connect.CodeUnauthenticated,
		connect.CodeResourceExhausted,
		connect.CodeFailedPrecondition,
		connect.CodeAborted,
		connect.CodeOutOfRange:
		return slog.LevelInfo, "RPC request rejected", code.String()
	default:
		return slog.LevelError, "RPC request failed", code.String()
	}
}

// RecoveryInterceptor recovers from panics in Connect handlers and returns an internal error.
type RecoveryInterceptor struct {
	logStacktrace bool
}

// NewRecoveryInterceptor creates a new recovery interceptor.
func NewRecoveryInterceptor(logStacktrace bool) *RecoveryInterceptor {
	return &RecoveryInterceptor{logStacktrace: logStacktrace}
}

func (in *RecoveryInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (resp connect.AnyResponse, err error) {
		defer func() {
			if r := recover(); r != nil {
				in.logPanic(ctx, req.Spec().Procedure, r)
				err = connect.NewError(connect.CodeInternal, pkgerrors.New("internal server error"))
			}
		}()
		return next(ctx, req)
	}
}

func (*RecoveryInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (*RecoveryInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}

func (in *RecoveryInterceptor) logPanic(ctx context.Context, procedure string, panicValue any) {
	attrs := []slog.Attr{
		slog.String("transport", "connect"),
		slog.String("method", procedure),
		slog.String("outcome", "panic_recovered"),
		slog.String("rpc_code", connect.CodeInternal.String()),
		slog.String("panic_type", fmt.Sprintf("%T", panicValue)),
	}
	if in.logStacktrace {
		attrs = append(attrs, slog.String("stacktrace", string(debug.Stack())))
	}
	slog.LogAttrs(ctx, slog.LevelError, "panic recovered in Connect handler", attrs...)
}

// AuthInterceptor enforces authentication and anonymous-access policy for Connect
// handlers by delegating to the shared Authorizer. Role-based authorization
// (admin checks) remains in the service layer.
type AuthInterceptor struct {
	authorizer *Authorizer
}

// NewAuthInterceptor creates a new auth interceptor backed by the shared Authorizer.
func NewAuthInterceptor(authorizer *Authorizer) *AuthInterceptor {
	return &AuthInterceptor{authorizer: authorizer}
}

func (in *AuthInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		header := req.Header()
		authHeader := header.Get("Authorization")

		result := in.authorizer.Authenticate(ctx, authHeader)
		if err := in.authorizer.CheckAccess(ctx, req.Spec().Procedure, result); err != nil {
			return nil, connect.NewError(connect.CodeUnauthenticated, err)
		}

		ctx = auth.ApplyToContext(ctx, result)
		return next(ctx, req)
	}
}

func (*AuthInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (*AuthInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}
