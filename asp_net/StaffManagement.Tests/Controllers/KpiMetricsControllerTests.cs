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
    public class KpiMetricsControllerTests
    {
        [Fact]
        public async Task GetMetrics_ReturnsBadRequest_WhenRangeIsNullOrEmpty()
        {
            // Arrange
            var mockService = new Mock<KpiMetricsService>(null!);
            var controller = new KpiMetricsController(mockService.Object);

            // Act
            var result = await controller.GetMetrics(1, "", null);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            badRequest.Should().NotBeNull();
            badRequest!.StatusCode.Should().Be(400);

            badRequest.Value.Should().Be("Invalid range. Use format YYYY-MM-DD:YYYY-MM-DD");
        }

        [Fact]
        public async Task GetMetrics_ReturnsBadRequest_WhenRangeHasNoColon()
        {
            // Arrange
            var mockService = new Mock<KpiMetricsService>(null!);
            var controller = new KpiMetricsController(mockService.Object);

            // Act
            var result = await controller.GetMetrics(1, "2025-01-01", null);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            badRequest.Should().NotBeNull();
            badRequest!.StatusCode.Should().Be(400);

            badRequest.Value.Should().Be("Invalid range. Use format YYYY-MM-DD:YYYY-MM-DD");
        }

        [Fact]
        public async Task GetMetrics_ReturnsBadRequest_WhenDatesAreInvalid()
        {
            // Arrange
            var mockService = new Mock<KpiMetricsService>(null!);
            var controller = new KpiMetricsController(mockService.Object);

            // Act
            var result = await controller.GetMetrics(1, "invalid:date", null);

            // Assert
            var badRequest = result as BadRequestObjectResult;
            badRequest.Should().NotBeNull();
            badRequest!.StatusCode.Should().Be(400);

            badRequest.Value.Should().Be("Invalid dates in range.");
        }

        [Fact]
        public async Task GetMetrics_ReturnsOk_WithMetricsList()
        {
            // Arrange
            int userId = 5;
            DateTime start = new DateTime(2025, 01, 01);
            DateTime end = new DateTime(2025, 01, 31);
            int? kpi = 3;

            var expectedList = new List<KpiMetricSnapshotDto>
            {
                new KpiMetricSnapshotDto
                {
                    KpiId = 3,
                    KpiName = "Sales",
                    TargetValue = 100,
                    ActualValue = 120,
                    Difference = 20,
                    Progress = 120,
                    PeriodStart = start,
                    PeriodEnd = end
                }
            };

            var mockService = new Mock<KpiMetricsService>(null!);
            mockService
                .Setup(s => s.GetMetricsSnapshotAsync(userId, start, end, kpi))
                .ReturnsAsync(expectedList);

            var controller = new KpiMetricsController(mockService.Object);

            // Act
            var result = await controller.GetMetrics(
                userId,
                "2025-01-01:2025-01-31",
                kpi);

            // Assert
            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.StatusCode.Should().Be(200);

            ok.Value.Should().BeEquivalentTo(expectedList);
        }

        [Fact]
        public async Task GetMetrics_ReturnsOk_WhenKpiIsNull()
        {
            // Arrange
            int userId = 10;
            DateTime start = new DateTime(2025, 02, 01);
            DateTime end = new DateTime(2025, 02, 28);

            var metrics = new List<KpiMetricSnapshotDto>
            {
                new KpiMetricSnapshotDto
                {
                    KpiId = 1,
                    KpiName = "Attendance",
                    TargetValue = 20,
                    ActualValue = 18,
                    Difference = -2,
                    Progress = 90,
                    PeriodStart = start,
                    PeriodEnd = end
                }
            };

            var mockService = new Mock<KpiMetricsService>(null!);
            mockService
                .Setup(s => s.GetMetricsSnapshotAsync(userId, start, end, null))
                .ReturnsAsync(metrics);

            var controller = new KpiMetricsController(mockService.Object);

            // Act
            var result = await controller.GetMetrics(
                userId,
                "2025-02-01:2025-02-28",
                null);

            // Assert
            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.StatusCode.Should().Be(200);

            ok.Value.Should().BeEquivalentTo(metrics);
        }
    }
}
