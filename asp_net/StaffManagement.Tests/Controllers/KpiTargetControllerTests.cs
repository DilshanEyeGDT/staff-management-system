using Microsoft.AspNetCore.Mvc;
using Moq;
using StaffManagement.Controllers;
using StaffManagement.Dtos;
using StaffManagement.Services;

namespace StaffManagement.Tests.Controllers
{
    public class KpiTargetControllerTests
    {
        private readonly Mock<KpiTargetService> _serviceMock;
        private readonly KpiTargetController _controller;

        public KpiTargetControllerTests()
        {
            _serviceMock = new Mock<KpiTargetService>(null);
            _controller = new KpiTargetController(_serviceMock.Object);
        }

        [Fact]
        public async Task CreateOrUpdate_ReturnsOk_WithDto()
        {
            // Arrange
            var dto = new CreateOrUpdateKpiTargetDto
            {
                UserId = 1,
                KpiId = 10,
                PeriodStart = new DateTime(2024, 1, 1),
                PeriodEnd = new DateTime(2024, 12, 31),
                TargetValue = 50
            };

            var expectedResult = new KpiTargetDto
            {
                KpiTargetId = 100,
                UserId = 1,
                KpiId = 10,
                PeriodStart = dto.PeriodStart,
                PeriodEnd = dto.PeriodEnd,
                TargetValue = dto.TargetValue,
                Message = "New target created."
            };

            _serviceMock
                .Setup(s => s.CreateOrUpdateTargetAsync(dto))
                .ReturnsAsync(expectedResult);

            // Act
            var response = await _controller.CreateOrUpdate(dto);
            var result = response.Result as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.Equal(200, result.StatusCode);

            var returnedDto = result.Value as KpiTargetDto;
            Assert.NotNull(returnedDto);
            Assert.Equal(expectedResult.KpiTargetId, returnedDto.KpiTargetId);

            _serviceMock.Verify(s => s.CreateOrUpdateTargetAsync(dto), Times.Once);
        }

        [Fact]
        public async Task CreateOrUpdate_ReturnsBadRequest_OnException()
        {
            // Arrange
            var dto = new CreateOrUpdateKpiTargetDto
            {
                UserId = 1,
                KpiId = 10,
                PeriodStart = DateTime.UtcNow,
                PeriodEnd = DateTime.UtcNow,
                TargetValue = 100
            };

            _serviceMock
                .Setup(s => s.CreateOrUpdateTargetAsync(dto))
                .ThrowsAsync(new Exception("Something went wrong"));

            // Act
            var response = await _controller.CreateOrUpdate(dto);

            // Assert
            var result = Assert.IsType<BadRequestObjectResult>(response.Result);
            Assert.Equal(400, result.StatusCode);

            // Extract message from either ProblemDetails or anonymous object
            string message = null;

            if (result.Value is ProblemDetails pd)
            {
                message = pd.Detail; // ASP.NET converts anonymous error into ProblemDetails sometimes
            }
            else
            {
                // Expecting an anonymous object { message = "..." }
                var prop = result.Value.GetType().GetProperty("message");
                if (prop != null)
                    message = prop.GetValue(result.Value)?.ToString();
            }

            Assert.Equal("Something went wrong", message);

            _serviceMock.Verify(s => s.CreateOrUpdateTargetAsync(dto), Times.Once);
        }


    }
}
