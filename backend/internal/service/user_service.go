package service

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type UserService interface {
	GetUserByID(userID uuid.UUID) (*model.UserResponse, error)
	GetProfile(userID uuid.UUID) (*model.User, error)
	UpdateProfile(userID uuid.UUID, req *model.UpdateProfileRequest) (*model.User, error)
	ListUsers(page int, limit int, orderBy string, dir string) ([]*model.User, int64, error)
	GetLeaderboard(limit int) ([]*model.LeaderboardUser, error)
}

type userService struct {
	userRepo interfaces.UserRepository
	logger   logger.Logger
}

func NewUserService(userRepo interfaces.UserRepository, logger logger.Logger) UserService {
	return &userService{
		userRepo: userRepo,
		logger:   logger,
	}
}

func (s *userService) GetUserByID(userID uuid.UUID) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return user.ToResponse(), nil
}

func (s *userService) GetProfile(userID uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
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

func (s *userService) UpdateProfile(userID uuid.UUID, req *model.UpdateProfileRequest) (*model.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// 프로필 정보 업데이트
	user.Homepage = req.Homepage
	user.LinkedIn = req.LinkedIn
	user.GitHub = req.GitHub
	user.Company = req.Company
	user.JobTitle = req.JobTitle
	user.FavLanguage = req.FavLanguage

	if err := s.userRepo.Update(user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
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
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	return users, total, nil
}

// GetLeaderboard 레이팅 기준 상위 사용자 조회
func (s *userService) GetLeaderboard(limit int) ([]*model.LeaderboardUser, error) {
	users, _, err := s.userRepo.ListUsers(0, limit, "rating", "desc")
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	// User를 LeaderboardUser DTO로 변환
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
