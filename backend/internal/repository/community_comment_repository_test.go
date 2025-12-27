package repository

import (
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

func TestBuildPostCommentTree_MultiLevelNesting_BuildsTree(t *testing.T) {
	postID := uuid.New()
	userID := uuid.New()

	aID := uuid.New()
	bID := uuid.New()
	cID := uuid.New()
	dID := uuid.New()

	t1 := time.Date(2025, 12, 18, 0, 0, 0, 0, time.UTC)
	t2 := t1.Add(1 * time.Minute)
	t3 := t1.Add(2 * time.Minute)
	t4 := t1.Add(3 * time.Minute)

	a := &model.PostComment{ID: aID, PostID: postID, UserID: userID, Content: "A", CreatedAt: t1}
	aParentID := a.ID
	b := &model.PostComment{ID: bID, PostID: postID, UserID: userID, ParentID: &aParentID, Content: "B", CreatedAt: t2}
	bParentID := b.ID
	c := &model.PostComment{ID: cID, PostID: postID, UserID: userID, ParentID: &bParentID, Content: "C", CreatedAt: t3}
	d := &model.PostComment{ID: dID, PostID: postID, UserID: userID, Content: "D", CreatedAt: t4}

	// Intentionally shuffled to ensure we don't depend on input order (map is built first).
	all := []*model.PostComment{b, d, c, a}

	top := buildPostCommentTree(all)
	require.Len(t, top, 2)

	// Top-level should contain A and D
	var topA, topD *model.PostComment
	for _, tc := range top {
		switch tc.ID {
		case a.ID:
			topA = tc
		case d.ID:
			topD = tc
		}
	}
	require.NotNil(t, topA)
	require.NotNil(t, topD)

	// A -> B -> C
	require.Len(t, topA.Replies, 1)
	require.Equal(t, b.ID, topA.Replies[0].ID)
	require.Len(t, topA.Replies[0].Replies, 1)
	require.Equal(t, c.ID, topA.Replies[0].Replies[0].ID)
}

func TestBuildPostCommentTree_WithThreadFields_BuildsTreeCorrectly(t *testing.T) {
	postID := uuid.New()
	userID := uuid.New()

	aID := uuid.New()
	bID := uuid.New()
	cID := uuid.New()

	t1 := time.Date(2025, 12, 18, 0, 0, 0, 0, time.UTC)
	t2 := t1.Add(1 * time.Minute)
	t3 := t1.Add(2 * time.Minute)

	// Top-level comment A
	a := &model.PostComment{
		ID:       aID,
		PostID:   postID,
		UserID:   userID,
		Content:  "A",
		ThreadID: aID, // thread_id is its own ID
		Depth:    0,
		Path:     aID.String(),
		CreatedAt: t1,
	}

	// First-level reply B
	aParentID := a.ID
	b := &model.PostComment{
		ID:       bID,
		PostID:   postID,
		UserID:   userID,
		ParentID: &aParentID,
		Content:  "B",
		ThreadID: aID, // thread_id is A's ID
		Depth:    1,
		Path:     aID.String() + "/" + bID.String(),
		CreatedAt: t2,
	}

	// Second-level reply C
	bParentID := b.ID
	c := &model.PostComment{
		ID:       cID,
		PostID:   postID,
		UserID:   userID,
		ParentID: &bParentID,
		Content:  "C",
		ThreadID: aID, // thread_id is A's ID
		Depth:    2,
		Path:     aID.String() + "/" + bID.String() + "/" + cID.String(),
		CreatedAt: t3,
	}

	all := []*model.PostComment{a, b, c}
	top := buildPostCommentTree(all)

	require.Len(t, top, 1)
	require.Equal(t, a.ID, top[0].ID)
	require.Equal(t, aID, top[0].ThreadID)
	require.Equal(t, 0, top[0].Depth)
	require.Equal(t, aID.String(), top[0].Path)

	require.Len(t, top[0].Replies, 1)
	require.Equal(t, b.ID, top[0].Replies[0].ID)
	require.Equal(t, aID, top[0].Replies[0].ThreadID)
	require.Equal(t, 1, top[0].Replies[0].Depth)
	require.Equal(t, aID.String()+"/"+bID.String(), top[0].Replies[0].Path)

	require.Len(t, top[0].Replies[0].Replies, 1)
	require.Equal(t, c.ID, top[0].Replies[0].Replies[0].ID)
	require.Equal(t, aID, top[0].Replies[0].Replies[0].ThreadID)
	require.Equal(t, 2, top[0].Replies[0].Replies[0].Depth)
	require.Equal(t, aID.String()+"/"+bID.String()+"/"+cID.String(), top[0].Replies[0].Replies[0].Path)
}
