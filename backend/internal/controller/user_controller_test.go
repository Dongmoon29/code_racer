package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// This is a lightweight integration-style test using the in-memory sqlite from testutil
// mockUserService implements only the methods used by controller
type mockUserService struct {
	u *model.UserResponse
	g []model.RecentGameSummary
}

func (m *mockUserService) GetUserByID(id uuid.UUID) (*model.UserResponse, error) { return m.u, nil }
func (m *mockUserService) GetProfile(id uuid.UUID) (*model.User, error)          { return &model.User{}, nil }
func (m *mockUserService) UpdateProfile(id uuid.UUID, req *model.UpdateProfileRequest) (*model.User, error) {
	return &model.User{}, nil
}
func (m *mockUserService) ListUsers(page int, limit int, orderBy string, dir string) ([]*model.User, int64, error) {
	return []*model.User{}, 0, nil
}
func (m *mockUserService) GetLeaderboard(limit int) ([]*model.LeaderboardUser, error) {
	return []*model.LeaderboardUser{}, nil
}
func (m *mockUserService) GetRecentGames(id uuid.UUID, limit int) ([]model.RecentGameSummary, error) {
	return m.g, nil
}

func TestGetCurrentUser_WithRecentGamesDTO(t *testing.T) {
	gin.SetMode(gin.TestMode)

	log := testutil.SetupTestLogger()
	uid := uuid.New()
	svc := &mockUserService{
		u: &model.UserResponse{ID: uid, Email: "u@test.com", Name: "User"},
		g: []model.RecentGameSummary{{ID: uuid.New(), Status: model.MatchStatusFinished}},
	}
	ctrl := NewUserController(svc, log)

	req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
	w := httptest.NewRecorder()
	r := gin.New()
	r.GET("/api/users/me", func(c *gin.Context) { c.Set("userID", uid) }, ctrl.GetCurrentUser)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d body=%s", w.Code, w.Body.String())
	}

	var resp struct {
		Success bool
		Data    model.CurrentUserMeResponse
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !resp.Success {
		t.Fatalf("success=false")
	}
	if resp.Data.User == nil || resp.Data.User.Email != "u@test.com" {
		t.Fatalf("user not returned")
	}
	if len(resp.Data.RecentGames) != 1 {
		t.Fatalf("recent_games length want 1 got %d", len(resp.Data.RecentGames))
	}
	if resp.Data.RecentGames[0].Status != model.MatchStatusFinished {
		t.Fatalf("recent game not finished")
	}
}
