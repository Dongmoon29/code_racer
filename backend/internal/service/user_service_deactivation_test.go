package service

import (
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type deactivationUserRepository struct {
	user          *model.User
	deactivateErr error
	deactivatedID uuid.UUID
}

func (r *deactivationUserRepository) Create(*model.User) error { return nil }
func (r *deactivationUserRepository) FindByID(uuid.UUID) (*model.User, error) {
	return r.user, nil
}
func (r *deactivationUserRepository) FindByEmail(string) (*model.User, error) { return r.user, nil }
func (r *deactivationUserRepository) Update(*model.User) error                { return nil }
func (r *deactivationUserRepository) Deactivate(id uuid.UUID, _ time.Time) error {
	r.deactivatedID = id
	return r.deactivateErr
}
func (r *deactivationUserRepository) ListUsers(int, int, string, string, string) ([]*model.User, int64, error) {
	return nil, 0, nil
}
func (r *deactivationUserRepository) GetLeaderboardUsers(int) ([]*model.User, error) {
	return nil, nil
}

func TestDeactivateUserRejectsSelfDeactivation(t *testing.T) {
	id := uuid.New()
	repo := &deactivationUserRepository{user: &model.User{ID: id, AccountStatus: model.AccountStatusActive}}
	svc := NewUserService(repo, nil, testutil.SetupTestLogger())

	err := svc.DeactivateUser(id, id)
	require.Error(t, err)
	appErr, ok := apperr.As(err)
	require.True(t, ok)
	assert.Equal(t, apperr.CodeConflict, appErr.Code)
	assert.Equal(t, uuid.Nil, repo.deactivatedID)
}

func TestDeactivateUserRejectsAdminTarget(t *testing.T) {
	targetID := uuid.New()
	repo := &deactivationUserRepository{user: &model.User{
		ID:            targetID,
		Role:          model.RoleAdmin,
		AccountStatus: model.AccountStatusActive,
	}}
	svc := NewUserService(repo, nil, testutil.SetupTestLogger())

	err := svc.DeactivateUser(uuid.New(), targetID)
	require.Error(t, err)
	appErr, ok := apperr.As(err)
	require.True(t, ok)
	assert.Equal(t, apperr.CodeForbidden, appErr.Code)
	assert.Equal(t, uuid.Nil, repo.deactivatedID)
}

func TestDeactivateUserRejectsActiveMatch(t *testing.T) {
	targetID := uuid.New()
	repo := &deactivationUserRepository{
		user: &model.User{
			ID:            targetID,
			Role:          model.RoleUser,
			AccountStatus: model.AccountStatusActive,
		},
		deactivateErr: repository.ErrUserHasActiveMatch,
	}
	svc := NewUserService(repo, nil, testutil.SetupTestLogger())

	err := svc.DeactivateUser(uuid.New(), targetID)
	require.Error(t, err)
	appErr, ok := apperr.As(err)
	require.True(t, ok)
	assert.Equal(t, apperr.CodeConflict, appErr.Code)
}

func TestDeactivateUserSucceeds(t *testing.T) {
	targetID := uuid.New()
	repo := &deactivationUserRepository{user: &model.User{
		ID:            targetID,
		Role:          model.RoleUser,
		AccountStatus: model.AccountStatusActive,
	}}
	svc := NewUserService(repo, nil, testutil.SetupTestLogger())

	require.NoError(t, svc.DeactivateUser(uuid.New(), targetID))
	assert.Equal(t, targetID, repo.deactivatedID)
}
