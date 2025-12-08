using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Dtos;
using StaffManagement.Services;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace StaffManagement.Tests.Controllers
{
    public class TrainingControllerTests
    {
        [Fact]
        public async Task GetCourses_WithoutQuery_ReturnsAllCourses()
        {
            // Arrange
            var mockService = new Mock<TrainingCourseService>(null!);
            var sampleCourses = new List<TrainingCourseDto>
            {
                new TrainingCourseDto { CourseId = 1, Title = "C# Basics", Category = "Programming", DurationHours = 5, CreatedAt = DateTime.UtcNow },
                new TrainingCourseDto { CourseId = 2, Title = "ASP.NET Core", Category = "Programming", DurationHours = 10, CreatedAt = DateTime.UtcNow }
            };
            int totalCount = sampleCourses.Count;

            mockService.Setup(s => s.GetCoursesAsync(null, 1, 10))
                       .ReturnsAsync((sampleCourses, totalCount));

            var controller = new TrainingController(mockService.Object);

            // Act
            var result = await controller.GetCourses(null, 1, 10);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            okResult.StatusCode.Should().Be(200);

            // Convert anonymous object to dictionary
            var dict = System.Text.Json.JsonSerializer
                .Serialize(okResult.Value);
            var obj = System.Text.Json.JsonSerializer
                .Deserialize<Dictionary<string, object>>(dict);

            obj.Should().NotBeNull();
            ((JsonElement)obj!["totalCount"]).GetInt32().Should().Be(totalCount);
            ((JsonElement)obj["page"]).GetInt32().Should().Be(1);
            ((JsonElement)obj["size"]).GetInt32().Should().Be(10);
        }

        [Fact]
        public async Task GetCourses_WithQuery_ReturnsFilteredResults()
        {
            // Arrange
            var mockService = new Mock<TrainingCourseService>(null!);
            var query = "C#";
            var filteredCourses = new List<TrainingCourseDto>
            {
                new TrainingCourseDto { CourseId = 1, Title = "C# Basics", Category = "Programming", DurationHours = 5, CreatedAt = DateTime.UtcNow }
            };
            int totalCount = filteredCourses.Count;

            mockService.Setup(s => s.GetCoursesAsync(query, 1, 10))
                       .ReturnsAsync((filteredCourses, totalCount));

            var controller = new TrainingController(mockService.Object);

            // Act
            var result = await controller.GetCourses(query, 1, 10);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            okResult.StatusCode.Should().Be(200);

            var dict = System.Text.Json.JsonSerializer
                .Serialize(okResult.Value);
            var obj = System.Text.Json.JsonSerializer
                .Deserialize<Dictionary<string, object>>(dict);

            obj.Should().NotBeNull();
            ((JsonElement)obj!["totalCount"]).GetInt32().Should().Be(totalCount);
            ((JsonElement)obj["page"]).GetInt32().Should().Be(1);
            ((JsonElement)obj["size"]).GetInt32().Should().Be(10);
        }

        [Fact]
        public async Task GetCourses_WithPagination_ReturnsCorrectPage()
        {
            // Arrange
            var mockService = new Mock<TrainingCourseService>(null!);
            var sampleCourses = new List<TrainingCourseDto>
            {
                new TrainingCourseDto { CourseId = 3, Title = "Entity Framework", Category = "Programming", DurationHours = 8, CreatedAt = DateTime.UtcNow }
            };
            int totalCount = 15;

            mockService.Setup(s => s.GetCoursesAsync(null, 2, 1))
                       .ReturnsAsync((sampleCourses, totalCount));

            var controller = new TrainingController(mockService.Object);

            // Act
            var result = await controller.GetCourses(null, 2, 1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            okResult.StatusCode.Should().Be(200);

            var dict = System.Text.Json.JsonSerializer
                .Serialize(okResult.Value);
            var obj = System.Text.Json.JsonSerializer
                .Deserialize<Dictionary<string, object>>(dict);

            obj.Should().NotBeNull();
            ((JsonElement)obj!["totalCount"]).GetInt32().Should().Be(totalCount);
            ((JsonElement)obj["page"]).GetInt32().Should().Be(2);
            ((JsonElement)obj["size"]).GetInt32().Should().Be(1);
        }
    }
}
