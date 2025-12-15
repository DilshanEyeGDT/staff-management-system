package handlers

import (
	"net/http"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/repository"
	"github.com/gin-gonic/gin"
)

var userRepo = repository.NewUserRepository()

func GetUsers(c *gin.Context) {
	users, err := userRepo.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}
