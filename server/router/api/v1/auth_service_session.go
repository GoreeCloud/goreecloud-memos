package v1

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/pkg/errors"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/usememos/memos/internal/util"
	v1pb "github.com/usememos/memos/proto/gen/api/v1"
	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/server/auth"
	"github.com/usememos/memos/store"
)

func logWardveilAuthEvent(ctx context.Context, level slog.Level, event string, userID int32, err error) {
	attrs := []slog.Attr{
		slog.String("security_identity", "wardveil"),
		slog.String("event", event),
	}
	if userID != 0 {
		attrs = append(attrs, slog.Int64("user_id", int64(userID)))
	}
	if err != nil {
		attrs = append(attrs, slog.String("error", err.Error()))
	}
	slog.LogAttrs(ctx, level, "Wardveil Security authentication event", attrs...)
}

func (s *APIV1Service) doSignIn(ctx context.Context, user *store.User) (string, time.Time, error) {
	// Generate refresh token.
	tokenID := util.GenUUID()
	refreshToken, refreshExpiresAt, err := auth.GenerateRefreshToken(user.ID, tokenID, []byte(s.Secret))
	if err != nil {
		logWardveilAuthEvent(ctx, slog.LevelError, "session_refresh_token_generation_failed", user.ID, err)
		return "", time.Time{}, status.Error(codes.Internal, "failed to establish session")
	}

	// Persist refresh-token metadata before a cookie is issued. A session that
	// cannot be revoked or refreshed reliably must fail closed.
	clientInfo := s.extractClientInfo(ctx)
	refreshTokenRecord := &storepb.RefreshTokensUserSetting_RefreshToken{
		TokenId:    tokenID,
		ExpiresAt:  timestamppb.New(refreshExpiresAt),
		CreatedAt:  timestamppb.Now(),
		ClientInfo: clientInfo,
	}
	if err := s.Store.AddUserRefreshToken(ctx, user.ID, refreshTokenRecord); err != nil {
		logWardveilAuthEvent(ctx, slog.LevelError, "session_refresh_token_store_failed", user.ID, err)
		return "", time.Time{}, status.Error(codes.Internal, "failed to establish session")
	}

	// Generate the access token before emitting the refresh cookie. If generation
	// fails, roll back the stored refresh record so there is no orphaned session.
	accessToken, accessExpiresAt, err := auth.GenerateAccessTokenV2(
		user.ID,
		user.Username,
		string(user.Role),
		string(user.RowStatus),
		[]byte(s.Secret),
	)
	if err != nil {
		if cleanupErr := s.Store.RemoveUserRefreshToken(ctx, user.ID, tokenID); cleanupErr != nil {
			logWardveilAuthEvent(ctx, slog.LevelWarn, "session_refresh_token_rollback_failed", user.ID, cleanupErr)
		}
		logWardveilAuthEvent(ctx, slog.LevelError, "session_access_token_generation_failed", user.ID, err)
		return "", time.Time{}, status.Error(codes.Internal, "failed to establish session")
	}

	refreshCookie := s.buildRefreshTokenCookie(ctx, refreshToken, refreshExpiresAt)
	if err := SetResponseHeader(ctx, "Set-Cookie", refreshCookie); err != nil {
		if cleanupErr := s.Store.RemoveUserRefreshToken(ctx, user.ID, tokenID); cleanupErr != nil {
			logWardveilAuthEvent(ctx, slog.LevelWarn, "session_refresh_token_rollback_failed", user.ID, cleanupErr)
		}
		logWardveilAuthEvent(ctx, slog.LevelError, "session_cookie_write_failed", user.ID, err)
		return "", time.Time{}, status.Error(codes.Internal, "failed to establish session")
	}

	logWardveilAuthEvent(ctx, slog.LevelInfo, "session_created", user.ID, nil)
	return accessToken, accessExpiresAt, nil
}

// SignOut terminates the user's authentication.
// Revokes the refresh token and clears the authentication cookie.
//
// Authentication: Required (access token).
// Returns: Empty response on success.
func (s *APIV1Service) SignOut(ctx context.Context, _ *v1pb.SignOutRequest) (*emptypb.Empty, error) {
	claims := auth.GetUserClaims(ctx)
	if claims != nil {
		refreshToken := ""
		if md, ok := metadata.FromIncomingContext(ctx); ok {
			if cookies := md.Get("cookie"); len(cookies) > 0 {
				refreshToken = auth.ExtractRefreshTokenFromCookie(cookies[0])
			}
		}
		if refreshToken != "" {
			refreshClaims, err := auth.ParseRefreshToken(refreshToken, []byte(s.Secret))
			if err == nil {
				if err := s.Store.RemoveUserRefreshToken(ctx, claims.UserID, refreshClaims.TokenID); err != nil {
					logWardveilAuthEvent(ctx, slog.LevelWarn, "session_revocation_store_failed", claims.UserID, err)
				}
			}
		}
	}

	if err := s.clearAuthCookies(ctx); err != nil {
		userID := int32(0)
		if claims != nil {
			userID = claims.UserID
		}
		logWardveilAuthEvent(ctx, slog.LevelError, "session_cookie_clear_failed", userID, err)
		return nil, status.Error(codes.Internal, "failed to sign out")
	}
	if claims != nil {
		logWardveilAuthEvent(ctx, slog.LevelInfo, "session_signed_out", claims.UserID, nil)
	}
	return &emptypb.Empty{}, nil
}

// RefreshToken exchanges a valid refresh token for a new access token.
//
// This endpoint implements refresh token rotation with sliding window sessions:
// 1. Extracts the refresh token from the HttpOnly cookie (memos_refresh)
// 2. Validates the refresh token against the database (checking expiry and revocation)
// 3. Rotates the refresh token: generates a new one with fresh 30-day expiry
// 4. Generates a new short-lived access token (15 minutes)
// 5. Sets the new refresh token as HttpOnly cookie
// 6. Returns the new access token and its expiry time
//
// Token rotation provides:
// - Sliding window sessions: active users stay logged in indefinitely
// - Better security: stolen refresh tokens become invalid after legitimate refresh
//
// Authentication: Requires valid refresh token in cookie (public endpoint)
// Returns: New access token and expiry timestamp.
func (s *APIV1Service) RefreshToken(ctx context.Context, _ *v1pb.RefreshTokenRequest) (*v1pb.RefreshTokenResponse, error) {
	refreshToken := ""
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if cookies := md.Get("cookie"); len(cookies) > 0 {
			refreshToken = auth.ExtractRefreshTokenFromCookie(cookies[0])
		}
	}

	if refreshToken == "" {
		logWardveilAuthEvent(ctx, slog.LevelInfo, "session_refresh_missing", 0, nil)
		return nil, status.Error(codes.Unauthenticated, "refresh token not found")
	}

	authenticator := auth.NewAuthenticator(s.Store, s.Secret)
	user, oldTokenID, err := authenticator.AuthenticateByRefreshToken(ctx, refreshToken)
	if err != nil {
		logWardveilAuthEvent(ctx, slog.LevelInfo, "session_refresh_rejected", 0, nil)
		return nil, status.Error(codes.Unauthenticated, "invalid refresh token")
	}

	newTokenID := util.GenUUID()
	newRefreshToken, newRefreshExpiresAt, err := auth.GenerateRefreshToken(user.ID, newTokenID, []byte(s.Secret))
	if err != nil {
		logWardveilAuthEvent(ctx, slog.LevelError, "session_refresh_token_generation_failed", user.ID, err)
		return nil, status.Error(codes.Internal, "failed to refresh session")
	}

	accessToken, expiresAt, err := auth.GenerateAccessTokenV2(
		user.ID,
		user.Username,
		string(user.Role),
		string(user.RowStatus),
		[]byte(s.Secret),
	)
	if err != nil {
		logWardveilAuthEvent(ctx, slog.LevelError, "session_access_token_generation_failed", user.ID, err)
		return nil, status.Error(codes.Internal, "failed to refresh session")
	}

	clientInfo := s.extractClientInfo(ctx)
	newRefreshTokenRecord := &storepb.RefreshTokensUserSetting_RefreshToken{
		TokenId:    newTokenID,
		ExpiresAt:  timestamppb.New(newRefreshExpiresAt),
		CreatedAt:  timestamppb.Now(),
		ClientInfo: clientInfo,
	}
	if err := s.Store.AddUserRefreshToken(ctx, user.ID, newRefreshTokenRecord); err != nil {
		logWardveilAuthEvent(ctx, slog.LevelError, "session_refresh_token_store_failed", user.ID, err)
		return nil, status.Error(codes.Internal, "failed to refresh session")
	}

	// Write the replacement cookie before revoking the old token. If the response
	// header cannot be written, remove the new record and leave the old session
	// usable rather than stranding the user between two invalid states.
	newRefreshCookie := s.buildRefreshTokenCookie(ctx, newRefreshToken, newRefreshExpiresAt)
	if err := SetResponseHeader(ctx, "Set-Cookie", newRefreshCookie); err != nil {
		if cleanupErr := s.Store.RemoveUserRefreshToken(ctx, user.ID, newTokenID); cleanupErr != nil {
			logWardveilAuthEvent(ctx, slog.LevelWarn, "session_refresh_token_rollback_failed", user.ID, cleanupErr)
		}
		logWardveilAuthEvent(ctx, slog.LevelError, "session_cookie_write_failed", user.ID, err)
		return nil, status.Error(codes.Internal, "failed to refresh session")
	}

	if err := s.Store.RemoveUserRefreshToken(ctx, user.ID, oldTokenID); err != nil {
		// The old token expires naturally. Do not log the token identifier or cookie.
		logWardveilAuthEvent(ctx, slog.LevelWarn, "session_old_token_revocation_failed", user.ID, err)
	}

	logWardveilAuthEvent(ctx, slog.LevelInfo, "session_rotated", user.ID, nil)
	return &v1pb.RefreshTokenResponse{
		AccessToken: accessToken,
		ExpiresAt:   timestamppb.New(expiresAt),
	}, nil
}

func (s *APIV1Service) clearAuthCookies(ctx context.Context) error {
	refreshCookie := s.buildRefreshTokenCookie(ctx, "", time.Time{})
	if err := SetResponseHeader(ctx, "Set-Cookie", refreshCookie); err != nil {
		return errors.Wrap(err, "failed to set refresh cookie")
	}
	return nil
}

func isSecureRequest(ctx context.Context) bool {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return false
	}

	for _, value := range md.Get("x-forwarded-proto") {
		for _, proto := range strings.Split(value, ",") {
			if strings.EqualFold(strings.TrimSpace(proto), "https") {
				return true
			}
		}
	}

	for _, value := range md.Get("forwarded") {
		lowerValue := strings.ToLower(value)
		if strings.Contains(lowerValue, "proto=https") {
			return true
		}
	}

	for _, value := range md.Get("origin") {
		if strings.HasPrefix(strings.ToLower(strings.TrimSpace(value)), "https://") {
			return true
		}
	}

	return false
}

func (*APIV1Service) buildRefreshTokenCookie(ctx context.Context, refreshToken string, expireTime time.Time) string {
	attrs := []string{
		fmt.Sprintf("%s=%s", auth.RefreshTokenCookieName, refreshToken),
		"Path=/",
		"HttpOnly",
	}
	if expireTime.IsZero() {
		attrs = append(attrs, "Expires=Thu, 01 Jan 1970 00:00:00 GMT")
	} else {
		attrs = append(attrs, "Expires="+expireTime.UTC().Format("Mon, 02 Jan 2006 15:04:05 GMT"))
	}

	if isSecureRequest(ctx) {
		attrs = append(attrs, "SameSite=Lax", "Secure")
	} else {
		attrs = append(attrs, "SameSite=Lax")
	}
	return strings.Join(attrs, "; ")
}

func (s *APIV1Service) fetchCurrentUser(ctx context.Context) (*store.User, error) {
	userID := auth.GetUserID(ctx)
	if userID == 0 {
		return nil, nil
	}
	user, err := s.Store.GetUser(ctx, &store.FindUser{
		ID: &userID,
	})
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.Errorf("user %d not found", userID)
	}
	if user.RowStatus == store.Archived {
		return nil, nil
	}
	return user, nil
}

// extractClientInfo extracts comprehensive client information from the request context.
//
// This function parses metadata from the gRPC context to extract:
// - User Agent: Raw user agent string for detailed parsing
// - IP Address: Client IP from X-Forwarded-For or X-Real-IP headers
// - Device Type: "mobile", "tablet", or "desktop" (parsed from user agent)
// - Operating System: OS name and version (e.g., "iOS 17.1", "Windows 10/11")
// - Browser: Browser name and version (e.g., "Chrome 120.0.0.0")
//
// This information enables users to:
// - See all active sessions with device details
// - Identify suspicious login attempts
// - Revoke specific sessions from unknown devices.
func (s *APIV1Service) extractClientInfo(ctx context.Context) *storepb.RefreshTokensUserSetting_ClientInfo {
	clientInfo := &storepb.RefreshTokensUserSetting_ClientInfo{}

	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if userAgents := md.Get("user-agent"); len(userAgents) > 0 {
			userAgent := userAgents[0]
			clientInfo.UserAgent = userAgent
			s.parseUserAgent(userAgent, clientInfo)
		}
		if forwardedFor := md.Get("x-forwarded-for"); len(forwardedFor) > 0 {
			ipAddress := strings.Split(forwardedFor[0], ",")[0]
			ipAddress = strings.TrimSpace(ipAddress)
			clientInfo.IpAddress = ipAddress
		} else if realIP := md.Get("x-real-ip"); len(realIP) > 0 {
			clientInfo.IpAddress = realIP[0]
		}
	}

	return clientInfo
}

// parseUserAgent extracts device type, OS, and browser information from user agent string.
//
// Detection logic:
// - Device Type: Checks for keywords like "mobile", "tablet", "ipad"
// - OS: Pattern matches for iOS, Android, Windows, macOS, Linux, Chrome OS
// - Browser: Identifies Edge, Chrome, Firefox, Safari, Opera
//
// Note: This is a simplified parser. For production use with high accuracy requirements,
// consider using a dedicated user agent parsing library.
func (*APIV1Service) parseUserAgent(userAgent string, clientInfo *storepb.RefreshTokensUserSetting_ClientInfo) {
	if userAgent == "" {
		return
	}

	userAgent = strings.ToLower(userAgent)

	if strings.Contains(userAgent, "ipad") || strings.Contains(userAgent, "tablet") {
		clientInfo.DeviceType = "tablet"
	} else if strings.Contains(userAgent, "mobile") || strings.Contains(userAgent, "android") ||
		strings.Contains(userAgent, "iphone") || strings.Contains(userAgent, "ipod") ||
		strings.Contains(userAgent, "windows phone") || strings.Contains(userAgent, "blackberry") {
		clientInfo.DeviceType = "mobile"
	} else {
		clientInfo.DeviceType = "desktop"
	}

	if strings.Contains(userAgent, "iphone os") || strings.Contains(userAgent, "cpu os") {
		if idx := strings.Index(userAgent, "cpu os "); idx != -1 {
			versionStart := idx + 7
			versionEnd := strings.Index(userAgent[versionStart:], " ")
			if versionEnd != -1 {
				version := strings.ReplaceAll(userAgent[versionStart:versionStart+versionEnd], "_", ".")
				clientInfo.Os = "iOS " + version
			} else {
				clientInfo.Os = "iOS"
			}
		} else if idx := strings.Index(userAgent, "iphone os "); idx != -1 {
			versionStart := idx + 10
			versionEnd := strings.Index(userAgent[versionStart:], " ")
			if versionEnd != -1 {
				version := strings.ReplaceAll(userAgent[versionStart:versionStart+versionEnd], "_", ".")
				clientInfo.Os = "iOS " + version
			} else {
				clientInfo.Os = "iOS"
			}
		} else {
			clientInfo.Os = "iOS"
		}
	} else if strings.Contains(userAgent, "android") {
		if idx := strings.Index(userAgent, "android "); idx != -1 {
			versionStart := idx + 8
			versionEnd := strings.Index(userAgent[versionStart:], ";")
			if versionEnd == -1 {
				versionEnd = strings.Index(userAgent[versionStart:], ")")
			}
			if versionEnd != -1 {
				version := userAgent[versionStart : versionStart+versionEnd]
				clientInfo.Os = "Android " + version
			} else {
				clientInfo.Os = "Android"
			}
		} else {
			clientInfo.Os = "Android"
		}
	} else if strings.Contains(userAgent, "windows nt 10.0") {
		clientInfo.Os = "Windows 10/11"
	} else if strings.Contains(userAgent, "windows nt 6.3") {
		clientInfo.Os = "Windows 8.1"
	} else if strings.Contains(userAgent, "windows nt 6.1") {
		clientInfo.Os = "Windows 7"
	} else if strings.Contains(userAgent, "windows") {
		clientInfo.Os = "Windows"
	} else if strings.Contains(userAgent, "mac os x") {
		if idx := strings.Index(userAgent, "mac os x "); idx != -1 {
			versionStart := idx + 9
			versionEnd := strings.Index(userAgent[versionStart:], ";")
			if versionEnd == -1 {
				versionEnd = strings.Index(userAgent[versionStart:], ")")
			}
			if versionEnd != -1 {
				version := strings.ReplaceAll(userAgent[versionStart:versionStart+versionEnd], "_", ".")
				clientInfo.Os = "macOS " + version
			} else {
				clientInfo.Os = "macOS"
			}
		} else {
			clientInfo.Os = "macOS"
		}
	} else if strings.Contains(userAgent, "linux") {
		clientInfo.Os = "Linux"
	} else if strings.Contains(userAgent, "cros") {
		clientInfo.Os = "Chrome OS"
	}

	if strings.Contains(userAgent, "edg/") {
		if idx := strings.Index(userAgent, "edg/"); idx != -1 {
			versionStart := idx + 4
			versionEnd := strings.Index(userAgent[versionStart:], " ")
			if versionEnd == -1 {
				versionEnd = len(userAgent) - versionStart
			}
			version := userAgent[versionStart : versionStart+versionEnd]
			clientInfo.Browser = "Edge " + version
		} else {
			clientInfo.Browser = "Edge"
		}
	} else if strings.Contains(userAgent, "chrome/") && !strings.Contains(userAgent, "edg") {
		if idx := strings.Index(userAgent, "chrome/"); idx != -1 {
			versionStart := idx + 7
			versionEnd := strings.Index(userAgent[versionStart:], " ")
			if versionEnd == -1 {
				versionEnd = len(userAgent) - versionStart
			}
			version := userAgent[versionStart : versionStart+versionEnd]
			clientInfo.Browser = "Chrome " + version
		} else {
			clientInfo.Browser = "Chrome"
		}
	} else if strings.Contains(userAgent, "firefox/") {
		if idx := strings.Index(userAgent, "firefox/"); idx != -1 {
			versionStart := idx + 8
			versionEnd := strings.Index(userAgent[versionStart:], " ")
			if versionEnd == -1 {
				versionEnd = len(userAgent) - versionStart
			}
			version := userAgent[versionStart : versionStart+versionEnd]
			clientInfo.Browser = "Firefox " + version
		} else {
			clientInfo.Browser = "Firefox"
		}
	} else if strings.Contains(userAgent, "safari/") && !strings.Contains(userAgent, "chrome") && !strings.Contains(userAgent, "edg") {
		if idx := strings.Index(userAgent, "version/"); idx != -1 {
			versionStart := idx + 8
			versionEnd := strings.Index(userAgent[versionStart:], " ")
			if versionEnd == -1 {
				versionEnd = len(userAgent) - versionStart
			}
			version := userAgent[versionStart : versionStart+versionEnd]
			clientInfo.Browser = "Safari " + version
		} else {
			clientInfo.Browser = "Safari"
		}
	} else if strings.Contains(userAgent, "opera/") || strings.Contains(userAgent, "opr/") {
		clientInfo.Browser = "Opera"
	}
}
