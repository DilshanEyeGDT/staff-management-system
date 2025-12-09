package main

import (
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Register all routes
	routes.SetupRoutes(r)

	r.Run(":8088") // Start server on port 8080
}
