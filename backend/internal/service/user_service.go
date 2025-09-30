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
	ListUsers(page int, limit int) ([]*model.User, int64, error)
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

func (s *userService) ListUsers(page int, limit int) ([]*model.User, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	users, total, err := s.userRepo.ListUsers(offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	return users, total, nil
}
