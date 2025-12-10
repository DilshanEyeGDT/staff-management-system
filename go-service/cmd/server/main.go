package main

import (
	"log"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/database"
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {

	// Connect to DB
	if err := database.ConnectDatabase(); err != nil {
		log.Fatal("❌ Database connection failed:", err)
	}

	r := gin.Default()

	// Register all routes
	routes.SetupRoutes(r)

	r.Run(":8088") // Start server on port 8080
}
