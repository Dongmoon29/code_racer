package service

import (
	"errors"
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserService interface {
	GetUserByID(userID uuid.UUID) (*model.UserResponse, error)
	GetProfile(userID uuid.UUID) (*model.User, error)
	UpdateProfile(userID uuid.UUID, req *model.UpdateProfileRequest) (*model.User, error)
	ListUsers(page int, limit int, orderBy string, dir string) ([]*model.User, int64, error)
	GetLeaderboard(limit int) ([]*model.LeaderboardUser, error)
}

type userService struct {
	userRepo  interfaces.UserRepository
	matchRepo repository.MatchRepository
	logger    logger.Logger
}

// NewUserService creates a new UserService instance with the provided dependencies
func NewUserService(userRepo interfaces.UserRepository, matchRepo repository.MatchRepository, logger logger.Logger) UserService {
	return &userService{
		userRepo:  userRepo,
		matchRepo: matchRepo,
		logger:    logger,
	}
}

// (no SetMatchRepo; matchRepo is provided via constructor)

func (s *userService) GetUserByID(userID uuid.UUID) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "User not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load user")
	}
	return user.ToResponse(), nil
}

// GetRecentGames returns latest N matches of the user mapped to RecentGameSummary
func (s *userService) GetRecentGames(userID uuid.UUID, limit int) ([]model.RecentGameSummary, error) {
	if s.matchRepo == nil {
		return []model.RecentGameSummary{}, nil
	}
	if limit <= 0 {
		limit = 5
	}
	matches, err := s.matchRepo.FindRecentByUserID(userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent games: %w", err)
	}
	out := make([]model.RecentGameSummary, 0, len(matches))
	for _, m := range matches {
		var pb *struct {
			ID   uuid.UUID `json:"id"`
			Name string    `json:"name"`
		}
		if m.PlayerB != nil {
			pb = &struct {
				ID   uuid.UUID `json:"id"`
				Name string    `json:"name"`
			}{ID: m.PlayerB.ID, Name: m.PlayerB.Name}
		}
		g := model.RecentGameSummary{
			ID:        m.ID,
			Mode:      m.Mode,
			Status:    m.Status,
			WinnerID:  m.WinnerID,
			StartedAt: m.StartedAt,
			EndedAt:   m.EndedAt,
			CreatedAt: m.CreatedAt,
		}
		g.Problem = struct {
			ID         uuid.UUID `json:"id"`
			Title      string    `json:"title"`
			Difficulty string    `json:"difficulty"`
		}{ID: m.Problem.ID, Title: m.Problem.Title, Difficulty: string(m.Problem.Difficulty)}
		g.PlayerA = struct {
			ID   uuid.UUID `json:"id"`
			Name string    `json:"name"`
		}{ID: m.PlayerA.ID, Name: m.PlayerA.Name}
		g.PlayerB = pb
		out = append(out, g)
	}
	return out, nil
}

func (s *userService) GetProfile(userID uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "User not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load user profile")
	}

	return user, nil
}

func (s *userService) UpdateProfile(userID uuid.UUID, req *model.UpdateProfileRequest) (*model.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "User not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load user profile")
	}

	// 프로필 정보 업데이트
	if req.Name != "" {
		user.Name = req.Name
	}
	user.Homepage = req.Homepage
	user.LinkedIn = req.LinkedIn
	user.GitHub = req.GitHub
	user.Company = req.Company
	user.JobTitle = req.JobTitle
	user.FavLanguage = req.FavLanguage

	if err := s.userRepo.Update(user); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to update user profile")
	}

	return &model.User{
		Homepage:    user.Homepage,
		LinkedIn:    user.LinkedIn,
		GitHub:      user.GitHub,
		Company:     user.Company,
		JobTitle:    user.JobTitle,
		FavLanguage: user.FavLanguage,
	}, nil
}

func (s *userService) ListUsers(page int, limit int, orderBy string, dir string) ([]*model.User, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	// defaults
	if orderBy == "" {
		orderBy = "created_at"
	}
	if dir == "" {
		dir = "desc"
	}
	users, total, err := s.userRepo.ListUsers(offset, limit, orderBy, dir)
	if err != nil {
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to list users")
	}
	return users, total, nil
}

func (s *userService) GetLeaderboard(limit int) ([]*model.LeaderboardUser, error) {
	users, err := s.userRepo.GetLeaderboardUsers(limit)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load leaderboard")
	}

	leaderboardUsers := make([]*model.LeaderboardUser, len(users))
	for i, user := range users {
		leaderboardUsers[i] = &model.LeaderboardUser{
			ID:     user.ID,
			Name:   user.Name,
			Rating: user.Rating,
		}
	}

	return leaderboardUsers, nil
}
