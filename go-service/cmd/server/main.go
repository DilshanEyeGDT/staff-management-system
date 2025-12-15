package main

import (
	"log"
	"time"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/database"
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// Connect to DB
	if err := database.ConnectDatabase(); err != nil {
		log.Fatal("❌ Database connection failed:", err)
	}

	r := gin.Default()

	// ✅ CORS configuration for React frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // React app origin
		AllowMethods:     []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Register all routes
	routes.SetupRoutes(r)

	r.Run(":8088") // Start server on port 8088
}
