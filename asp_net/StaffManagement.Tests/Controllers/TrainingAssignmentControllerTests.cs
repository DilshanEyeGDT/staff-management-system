using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Dtos;
using StaffManagement.Services;
using Xunit;

namespace StaffManagement.Tests.Controllers
{
    public class TrainingAssignmentControllerTests
    {
        [Fact]
        public async Task UpdateAssignment_ReturnsOk_OnSuccess()
        {
            var mockService = new Mock<TrainingAssignmentService>(null!, null!);
            var dto = new UpdateTrainingAssignmentDto { Progress = 75, Status = "in-progress" };

            var returnedDto = new TrainingAssignmentDto
            {
                TrainingAssignmentId = 1,
                CourseId = 1,
                UserId = 1,
                AssignedOn = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(7),
                Progress = 75,
                Status = "in-progress",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserDisplayName = "Jane Doe",
                CourseTitle = "Advanced C#"
            };

            mockService.Setup(s => s.UpdateAssignmentAsync(1, dto))
                       .ReturnsAsync(returnedDto);

            var controller = new TrainingAssignmentController(mockService.Object);
            var result = await controller.UpdateAssignment(1, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            okResult.StatusCode.Should().Be(200);

            ((TrainingAssignmentDto)okResult.Value!).Should().Be(returnedDto);
        }
    }
}
