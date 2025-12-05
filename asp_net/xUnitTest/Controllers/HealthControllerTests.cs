using Xunit;
using Microsoft.EntityFrameworkCore;
using StaffManagement.Controllers;
using StaffManagement.Persistence;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FluentAssertions;

namespace xUnitTest.Tests.Controllers
{
    [Collection("Database collection")]
    public class HealthControllerTests
    {
        private readonly HealthController _controller;
        private readonly AppDbContext _dbContext;

        public HealthControllerTests()
        {
            // Setup InMemory DbContext
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;

            _dbContext = new AppDbContext(options);
            _controller = new HealthController(_dbContext);
        }

        [Fact]
        public async Task CheckDb_ReturnsOk_WhenDatabaseIsAvailable()
        {
            // Act
            var result = await _controller.CheckDb();

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult.StatusCode.Should().Be(200);
            okResult.Value.Should().BeEquivalentTo(new { status = "ok", message = "Database connection successful" });
        }
    }
}
