package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uuid.UUID) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	Update(user *model.User) error
}
