package interfaces

import (
	"time"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uuid.UUID) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	Update(user *model.User) error
	UpdateRole(id uuid.UUID, role model.Role) error
	Deactivate(id uuid.UUID, deactivatedAt time.Time) error
	// ListUsers returns users with offset/limit and total count, ordered by field/dir
	// search parameter searches in name, email, or ID fields
	ListUsers(offset int, limit int, orderByField string, orderDir string, search string) ([]*model.User, int64, error)
	// GetLeaderboardUsers returns users who have played at least one ranked PvP game
	GetLeaderboardUsers(limit int) ([]*model.User, error)
}
