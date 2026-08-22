package v1

import (
	"testing"

	"github.com/stretchr/testify/require"

	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

func TestConvertAttachmentFromStoreHidesManagedStorageReference(t *testing.T) {
	s3Attachment := &store.Attachment{
		UID:         "s3-image",
		Filename:    "image.png",
		Type:        "image/png",
		StorageType: storepb.AttachmentStorageType_S3,
		Reference:   "https://s3.example.com/presigned-secret",
	}
	require.Empty(t, convertAttachmentFromStore(s3Attachment).ExternalLink)

	externalAttachment := &store.Attachment{
		UID:         "external-image",
		Filename:    "image.png",
		Type:        "image/png",
		StorageType: storepb.AttachmentStorageType_EXTERNAL,
		Reference:   "https://cdn.example.com/image.png",
	}
	require.Equal(t, externalAttachment.Reference, convertAttachmentFromStore(externalAttachment).ExternalLink)
}

func TestConvertAttachmentFromStoreReportsMemoLinkage(t *testing.T) {
	memoUID := "linked-memo"
	attachment := &store.Attachment{
		UID:      "linked-image",
		Filename: "image.png",
		Type:     "image/png",
		MemoUID:  &memoUID,
	}

	converted := convertAttachmentFromStore(attachment)
	require.NotNil(t, converted.Memo)
	require.Equal(t, MemoNamePrefix+memoUID, *converted.Memo)
}

func TestConvertAttachmentFromStoreLeavesUnlinkedMemoUnset(t *testing.T) {
	attachment := &store.Attachment{
		UID:      "unlinked-image",
		Filename: "image.png",
		Type:     "image/png",
	}

	converted := convertAttachmentFromStore(attachment)
	require.Nil(t, converted.Memo)
}
