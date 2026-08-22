package v1

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"

	v1pb "github.com/usememos/memos/proto/gen/api/v1"
)

func TestValidateInstanceGeneralSetting(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		setting *v1pb.InstanceSetting_GeneralSetting
		wantErr string
	}{
		{
			name: "accepts canonical local branding",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:       "GoreeCloud Memos",
					Description: "Private quick capture",
					LogoUrl:     "/goreecloud-memos.svg",
				},
			},
		},
		{
			name: "rejects custom script",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				AdditionalScript: "console.log('unsafe')",
			},
			wantErr: "additional script is disabled",
		},
		{
			name: "rejects custom style",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				AdditionalStyle: "@import url(https://tracker.example/style.css);",
			},
			wantErr: "additional style is disabled",
		},
		{
			name: "rejects remote logo",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:   "GoreeCloud Memos",
					LogoUrl: "https://tracker.example/logo.svg",
				},
			},
			wantErr: "local root-relative path",
		},
		{
			name: "rejects protocol relative logo",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:   "GoreeCloud Memos",
					LogoUrl: "//tracker.example/logo.svg",
				},
			},
			wantErr: "local root-relative path",
		},
		{
			name: "rejects backslash logo path",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:   "GoreeCloud Memos",
					LogoUrl: "/\\tracker.example/logo.svg",
				},
			},
			wantErr: "backslashes",
		},
		{
			name: "rejects empty custom profile title",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:   "   ",
					LogoUrl: "/goreecloud-memos.svg",
				},
			},
			wantErr: "title is required",
		},
		{
			name: "rejects oversized title",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:   strings.Repeat("a", maxInstanceProfileTitleLength+1),
					LogoUrl: "/goreecloud-memos.svg",
				},
			},
			wantErr: "title is too long",
		},
		{
			name: "rejects oversized description",
			setting: &v1pb.InstanceSetting_GeneralSetting{
				CustomProfile: &v1pb.InstanceSetting_GeneralSetting_CustomProfile{
					Title:       "GoreeCloud Memos",
					Description: strings.Repeat("a", maxInstanceProfileDescriptionLength+1),
					LogoUrl:     "/goreecloud-memos.svg",
				},
			},
			wantErr: "description is too long",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := validateInstanceGeneralSetting(tt.setting)
			if tt.wantErr == "" {
				require.NoError(t, err)
				return
			}
			require.ErrorContains(t, err, tt.wantErr)
		})
	}
}

func TestValidateLocalBrandAssetPath(t *testing.T) {
	t.Parallel()

	require.NoError(t, validateLocalBrandAssetPath("/goreecloud-memos.svg"))
	require.NoError(t, validateLocalBrandAssetPath("/api/v1/attachments/123?thumbnail=1"))
	require.Error(t, validateLocalBrandAssetPath("data:image/svg+xml;base64,abc"))
	require.Error(t, validateLocalBrandAssetPath("javascript:alert(1)"))
	require.Error(t, validateLocalBrandAssetPath("//example.com/logo.svg"))
}
