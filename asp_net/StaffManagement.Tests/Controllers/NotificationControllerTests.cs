using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Persistence.Entities;
using StaffManagement.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace StaffManagement.Tests.Controllers
{
    public class NotificationControllerTests
    {
        [Fact]
        public async Task NotifyStaff_ReturnsOk_WithAssignmentsList()
        {
            // Arrange
            var mockService = new Mock<NotificationService>(null!);

            var assignments = new List<TrainingAssignment>
            {
                new TrainingAssignment
                {
                    TrainingAssignmentId = 1,
                    UserId = 101,
                    User = new Persistence.Entities.User { Id = 101, DisplayName = "John Doe" },
                    CourseId = 201,
                    Course = new Persistence.Entities.TrainingCourse { Id = 201, Title = "Safety Training" },
                    Status = "pending",
                    Progress = 50,
                    DueDate = DateTime.UtcNow.AddDays(7)
                },
                new TrainingAssignment
                {
                    TrainingAssignmentId = 2,
                    UserId = 102,
                    User = new Persistence.Entities.User { Id = 102, DisplayName = "Jane Smith" },
                    CourseId = 202,
                    Course = new Persistence.Entities.TrainingCourse { Id = 202, Title = "Compliance Training" },
                    Status = "completed",
                    Progress = 100,
                    DueDate = DateTime.UtcNow.AddDays(1)
                }
            };

            mockService
                .Setup(s => s.QueueRemindersForAllAsync())
                .ReturnsAsync(assignments);

            var controller = new NotificationController(mockService.Object);

            // Act
            var result = await controller.NotifyStaff();

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);

            var value = okResult.Value as IEnumerable<object>;
            value.Should().NotBeNull();

            var list = value!.ToList();
            list.Count.Should().Be(assignments.Count);

            // Verify first item
            var first = list[0];
            var firstType = first.GetType();
            firstType.GetProperty("TrainingAssignmentId")!.GetValue(first).Should().Be(assignments[0].TrainingAssignmentId);
            firstType.GetProperty("UserId")!.GetValue(first).Should().Be(assignments[0].UserId);
            firstType.GetProperty("UserName")!.GetValue(first).Should().Be(assignments[0].User.DisplayName);
            firstType.GetProperty("CourseId")!.GetValue(first).Should().Be(assignments[0].CourseId);
            firstType.GetProperty("CourseTitle")!.GetValue(first).Should().Be(assignments[0].Course.Title);
            firstType.GetProperty("Status")!.GetValue(first).Should().Be(assignments[0].Status);
            firstType.GetProperty("Progress")!.GetValue(first).Should().Be(assignments[0].Progress);
            firstType.GetProperty("DueDate")!.GetValue(first).Should().Be(assignments[0].DueDate);
        }

        [Fact]
        public async Task NotifyStaff_ReturnsEmptyList_WhenNoAssignments()
        {
            // Arrange
            var mockService = new Mock<NotificationService>(null!);
            mockService
                .Setup(s => s.QueueRemindersForAllAsync())
                .ReturnsAsync(new List<TrainingAssignment>());

            var controller = new NotificationController(mockService.Object);

            // Act
            var result = await controller.NotifyStaff();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            okResult.StatusCode.Should().Be(200);

            var value = okResult.Value as IEnumerable<object>;
            value.Should().NotBeNull();
            value!.Count().Should().Be(0);
        }
    }
}
