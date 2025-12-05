using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Dtos;
using StaffManagement.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace StaffManagement.Tests.Controllers
{
    public class TasksControllerTests
    {
        [Fact]
        public async Task GetTasks_ReturnsOkWithData()
        {
            // Arrange
            var mockService = new Mock<TaskService>(null!);
            var tasks = new List<TaskDto>
            {
                new TaskDto
                {
                    TaskId = Guid.NewGuid(),
                    Title = "Test Task",
                    Description = "Description",
                    Priority = 1,
                    Status = "open",
                    CreatedByUserId = 1,
                    AssigneeUserId = 2,
                    NotesCount = 0
                }
            };
            mockService
                .Setup(s => s.GetTasksAsync(null, null, 1, 10))
                .ReturnsAsync((tasks, tasks.Count));

            var controller = new TasksController(mockService.Object);

            // Act
            var result = await controller.GetTasks(null, null);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);

            okResult.Value.Should().BeEquivalentTo(new
            {
                totalCount = tasks.Count,
                page = 1,
                size = 10,
                tasks
            });
        }

        [Fact]
        public async Task UpdateTask_ReturnsOk_WhenTaskExists()
        {
            // Arrange
            var taskId = Guid.NewGuid();
            var dto = new UpdateTaskDto { Title = "Updated Task" };
            var updatedTask = new TaskDto
            {
                TaskId = taskId,
                Title = dto.Title,
                Description = "Description",
                Priority = 1,
                Status = "open",
                CreatedByUserId = 1,
                AssigneeUserId = 2,
                NotesCount = 0
            };

            var mockService = new Mock<TaskService>(null!);
            mockService
                .Setup(s => s.UpdateTaskAsync(taskId, dto))
                .ReturnsAsync(updatedTask);

            var controller = new TasksController(mockService.Object);

            // Act
            var result = await controller.UpdateTask(taskId, dto);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);
            okResult.Value.Should().BeEquivalentTo(updatedTask);
        }

        [Fact]
        public async Task UpdateTask_ReturnsNotFound_WhenTaskDoesNotExist()
        {
            // Arrange
            var taskId = Guid.NewGuid();
            var dto = new UpdateTaskDto { Title = "Updated Task" };

            var mockService = new Mock<TaskService>(null!);
            mockService
                .Setup(s => s.UpdateTaskAsync(taskId, dto))
                .ReturnsAsync((TaskDto?)null);

            var controller = new TasksController(mockService.Object);

            // Act
            var result = await controller.UpdateTask(taskId, dto);

            // Assert
            var notFoundResult = result as NotFoundObjectResult;
            notFoundResult.Should().NotBeNull();
            notFoundResult!.StatusCode.Should().Be(404);

            notFoundResult.Value.Should().BeEquivalentTo(new { message = "Task not found" });
        }

        [Fact]
        public async Task AddComment_ReturnsOk_WhenCommentIsAdded()
        {
            // Arrange
            var taskId = Guid.NewGuid();
            var dto = new CreateTaskCommentDto { CreatedByUserId = 1, Content = "Test Comment" };
            var comment = new TaskNoteResponseDto
            {
                TaskNoteId = Guid.NewGuid(),
                TaskId = taskId,
                AuthorUserId = dto.CreatedByUserId,
                Body = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            var mockService = new Mock<TaskService>(null!);
            mockService
                .Setup(s => s.AddCommentAsync(taskId, dto))
                .ReturnsAsync(comment);

            var controller = new TasksController(mockService.Object);

            // Act
            var result = await controller.AddComment(taskId, dto);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);
            okResult.Value.Should().BeEquivalentTo(comment);
        }

        [Fact]
        public async Task AddComment_ReturnsBadRequest_WhenDtoIsNull()
        {
            // Arrange
            var mockService = new Mock<TaskService>(null!);
            var controller = new TasksController(mockService.Object);

            // Act
            var result = await controller.AddComment(Guid.NewGuid(), null!);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            badRequest.Should().NotBeNull();
            badRequest!.StatusCode.Should().Be(400);
            badRequest.Value.Should().BeEquivalentTo(new { message = "Request body required" });
        }
    }
}
