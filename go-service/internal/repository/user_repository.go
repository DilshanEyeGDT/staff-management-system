package repository

import (
	"context"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/database"
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

// GetAllUsers fetches all users with id and display_name
func (r *UserRepository) GetAllUsers() ([]models.User, error) {
	ctx := context.Background()
	rows, err := database.DB.Query(ctx, `SELECT id, display_name FROM users ORDER BY id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.DisplayName); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
