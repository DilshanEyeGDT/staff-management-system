using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Dtos;
using StaffManagement.Services;
using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Xunit;

namespace StaffManagement.Tests.Controllers
{
    public class SchedulesControllerTests
    {
        [Fact]
        public async Task GetSchedules_ReturnsOkWithData()
        {
            // Arrange
            var mockService = new Mock<ScheduleService>(null!);
            var schedules = new List<ScheduleDto>
            {
                new ScheduleDto
                {
                    ScheduleId = Guid.NewGuid(),
                    Title = "Test Schedule",
                    CreatedByUserId = 1,
                    AssigneeUserId = 2,
                    StartAt = DateTime.UtcNow,
                    EndAt = DateTime.UtcNow.AddHours(1)
                }
            };
            mockService
                .Setup(s => s.GetSchedulesAsync(null, null, null, null, 1, 10))
                .ReturnsAsync((schedules, schedules.Count));

            var controller = new SchedulesController(mockService.Object);

            // Act
            var result = await controller.GetSchedules(null, null, null, null);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);

            okResult.Value.Should().BeEquivalentTo(new
            {
                totalCount = schedules.Count,
                page = 1,
                size = 10,
                schedules
            });
        }

        [Fact]
        public async Task CreateSchedule_ReturnsCreated_WhenDtoIsValid()
        {
            // Arrange
            var mockService = new Mock<ScheduleService>(null!);
            var dto = new CreateScheduleDto
            {
                CreatedByUserId = 1,
                Title = "New Schedule",
                StartAt = DateTime.UtcNow,
                EndAt = DateTime.UtcNow.AddHours(1)
            };
            var returnedDto = new ScheduleDto
            {
                ScheduleId = Guid.NewGuid(),
                CreatedByUserId = dto.CreatedByUserId,
                Title = dto.Title,
                StartAt = dto.StartAt,
                EndAt = dto.EndAt
            };

            mockService
                .Setup(s => s.CreateScheduleAsync(dto))
                .ReturnsAsync(returnedDto);

            var controller = new SchedulesController(mockService.Object);

            // Act
            var result = await controller.CreateSchedule(dto);

            // Assert
            var createdResult = result as CreatedAtActionResult;
            createdResult.Should().NotBeNull();
            createdResult!.StatusCode.Should().Be(201);

            var value = createdResult.Value as ScheduleDto;
            value.Should().NotBeNull();
            value!.ScheduleId.Should().Be(returnedDto.ScheduleId);
            value.Title.Should().Be(dto.Title);
        }

        [Fact]
        public async Task UpdateSchedule_ReturnsOk_WhenUpdateSucceeds()
        {
            // Arrange
            var scheduleId = Guid.NewGuid();
            var dto = new ScheduleUpdateDto { Title = "Updated Title" };

            var mockService = new Mock<ScheduleService>(null!);
            mockService
                .Setup(s => s.UpdateScheduleAsync(scheduleId, dto))
                .ReturnsAsync((true, "Updated"));

            var controller = new SchedulesController(mockService.Object);

            // Act
            var result = await controller.UpdateSchedule(scheduleId, dto);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);

            okResult.Value.Should().BeEquivalentTo(new
            {
                status = "ok",
                message = "Schedule updated successfully"
            });
        }

        [Fact]
        public async Task UpdateSchedule_ReturnsBadRequest_WhenUpdateFails()
        {
            // Arrange
            var scheduleId = Guid.NewGuid();
            var dto = new ScheduleUpdateDto { Title = "Updated" };
            var mockService = new Mock<ScheduleService>(null!);
            mockService
                .Setup(s => s.UpdateScheduleAsync(scheduleId, dto))
                .ReturnsAsync((false, "Schedule not found"));

            var controller = new SchedulesController(mockService.Object);

            // Act
            var result = await controller.UpdateSchedule(scheduleId, dto);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            badRequest.Should().NotBeNull();
            badRequest!.StatusCode.Should().Be(400);

            badRequest.Value.Should().BeEquivalentTo(new
            {
                status = "error",
                message = "Schedule not found"
            });
        }

        [Fact]
        public async Task DeleteSchedule_ReturnsOk_WhenDeleted()
        {
            // Arrange
            var scheduleId = Guid.NewGuid();
            var mockService = new Mock<ScheduleService>(null!);
            mockService
                .Setup(s => s.DeleteScheduleAsync(scheduleId))
                .ReturnsAsync(true);

            var controller = new SchedulesController(mockService.Object);

            // Act
            var result = await controller.DeleteSchedule(scheduleId);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);

            okResult.Value.Should().BeEquivalentTo(new
            {
                status = "ok",
                message = "Schedule deleted successfully"
            });
        }

        [Fact]
        public async Task DeleteSchedule_ReturnsNotFound_WhenScheduleDoesNotExist()
        {
            // Arrange
            var scheduleId = Guid.NewGuid();
            var mockService = new Mock<ScheduleService>(null!);
            mockService
                .Setup(s => s.DeleteScheduleAsync(scheduleId))
                .ReturnsAsync(false);

            var controller = new SchedulesController(mockService.Object);

            // Act
            var result = await controller.DeleteSchedule(scheduleId);

            // Assert
            var notFound = result as NotFoundObjectResult;
            notFound.Should().NotBeNull();
            notFound!.StatusCode.Should().Be(404);

            notFound.Value.Should().BeEquivalentTo(new
            {
                status = "error",
                message = "Schedule not found"
            });
        }
    }
}
