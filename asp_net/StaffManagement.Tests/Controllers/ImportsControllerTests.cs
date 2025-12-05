using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Dtos;
using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;

namespace StaffManagement.Tests.Controllers
{
    public class ImportsControllerTests
    {
        [Fact]
        public async Task ImportSchedules_ReturnsOk_WithJobId_WhenFileIsValid()
        {
            // Arrange
            var mockImportService = new Mock<ImportService>(null!, null!);

            var fakeJobId = Guid.NewGuid();

            // Mock CreateScheduleImportJobAsync to return fakeJobId
            mockImportService
                .Setup(s => s.CreateScheduleImportJobAsync(It.IsAny<IFormFile>(), It.IsAny<int?>()))
                .ReturnsAsync(fakeJobId);

            var controller = new ImportsController(mockImportService.Object);

            // Create a fake IFormFile
            var content = "fake,csv,content";
            var fileName = "test.csv";
            var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
            IFormFile file = new FormFile(stream, 0, stream.Length, "file", fileName);

            // Act
            var result = await controller.ImportSchedules(file);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);

            var dto = okResult.Value as ImportJobResponseDto;
            dto.Should().NotBeNull();
            dto!.JobId.Should().Be(fakeJobId);
            dto.Status.Should().Be("Pending");
        }

        [Fact]
        public async Task ImportSchedules_ReturnsBadRequest_WhenFileIsNull()
        {
            // Arrange
            var mockImportService = new Mock<ImportService>(null!, null!);
            var controller = new ImportsController(mockImportService.Object);

            // Act
            var result = await controller.ImportSchedules(null!);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            badRequest.Should().NotBeNull();
            badRequest!.StatusCode.Should().Be(400);
            badRequest.Value.Should().BeEquivalentTo(new { message = "File is empty." });
        }

        [Fact]
        public async Task GetImportStatus_ReturnsNotFound_WhenJobDoesNotExist()
        {
            // Arrange
            var jobId = Guid.NewGuid();
            var mockImportService = new Mock<ImportService>(null!, null!);
            mockImportService
                .Setup(s => s.GetImportJobAsync(jobId))
                .ReturnsAsync((StaffManagement.Persistence.Entities.ImportJob?)null);

            var controller = new ImportsController(mockImportService.Object);

            // Act
            var result = await controller.GetImportStatus(jobId);

            // Assert
            var notFound = result as NotFoundObjectResult;
            notFound.Should().NotBeNull();
            notFound!.StatusCode.Should().Be(404);
            notFound.Value.Should().BeEquivalentTo(new { message = "Import job not found" });
        }
    }
}
