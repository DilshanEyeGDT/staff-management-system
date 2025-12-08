using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers.Performance;
using StaffManagement.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace StaffManagement.Tests.Controllers.Performance
{
    public class PerfActualsImportControllerTests
    {
        [Fact]
        public async Task ImportKpiActuals_ReturnsOk_WhenFileIsValid()
        {
            // Arrange
            var mockService = new Mock<ImportService>(null!, null!, null!);
            var controller = new PerfActualsImportController(mockService.Object);

            var fileMock = new Mock<IFormFile>();
            var content = "user_id,kpi_id,period_date,actual_value\n1,101,2025-12-08,50";
            var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
            fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
            fileMock.Setup(f => f.Length).Returns(stream.Length);
            fileMock.Setup(f => f.FileName).Returns("test.csv");

            var expectedJobId = Guid.NewGuid();
            mockService
                .Setup(s => s.CreateKpiActualImportJobAsync(fileMock.Object, It.IsAny<int?>()))
                .ReturnsAsync(expectedJobId);

            // Act
            var result = await controller.ImportKpiActuals(fileMock.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            okResult.StatusCode.Should().Be(200);

            var value = okResult.Value!;
            var type = value.GetType();

            type.GetProperty("jobId")!.GetValue(value).Should().Be(expectedJobId);
            type.GetProperty("status")!.GetValue(value).Should().Be("queued");
        }

        [Fact]
        public async Task ImportKpiActuals_ReturnsBadRequest_WhenFileIsNull()
        {
            var mockService = new Mock<ImportService>(null!, null!, null!);
            var controller = new PerfActualsImportController(mockService.Object);

            var result = await controller.ImportKpiActuals(null);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            badRequest.StatusCode.Should().Be(400);

            // Use JsonSerializer to read the message
            var json = JsonSerializer.Serialize(badRequest.Value);
            var doc = JsonDocument.Parse(json);
            var message = doc.RootElement.GetProperty("message").GetString();

            message.Should().Be("CSV file is required.");
        }

        [Fact]
        public async Task ImportKpiActuals_ReturnsBadRequest_OnInvalidOperationException()
        {
            var mockService = new Mock<ImportService>(null!, null!, null!);
            var controller = new PerfActualsImportController(mockService.Object);

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(1);
            fileMock.Setup(f => f.FileName).Returns("file.csv");

            var exceptionMessage = "Invalid operation";
            mockService
                .Setup(s => s.CreateKpiActualImportJobAsync(fileMock.Object, It.IsAny<int?>()))
                .ThrowsAsync(new InvalidOperationException(exceptionMessage));

            var result = await controller.ImportKpiActuals(fileMock.Object);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            badRequest.StatusCode.Should().Be(400);

            var json = JsonSerializer.Serialize(badRequest.Value);
            var doc = JsonDocument.Parse(json);
            var message = doc.RootElement.GetProperty("message").GetString();

            message.Should().Be(exceptionMessage);
        }

        [Fact]
        public async Task ImportKpiActuals_ReturnsServerError_OnGenericException()
        {
            var mockService = new Mock<ImportService>(null!, null!, null!);
            var controller = new PerfActualsImportController(mockService.Object);

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(1);
            fileMock.Setup(f => f.FileName).Returns("file.csv");

            var exceptionMessage = "Something went wrong";
            mockService
                .Setup(s => s.CreateKpiActualImportJobAsync(fileMock.Object, It.IsAny<int?>()))
                .ThrowsAsync(new Exception(exceptionMessage));

            var result = await controller.ImportKpiActuals(fileMock.Object);
            var serverError = Assert.IsType<ObjectResult>(result);
            serverError.StatusCode.Should().Be(500);

            var json = JsonSerializer.Serialize(serverError.Value);
            var doc = JsonDocument.Parse(json);
            var message = doc.RootElement.GetProperty("message").GetString();

            message.Should().Be(exceptionMessage);
        }
    }
}
