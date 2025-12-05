using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagement.Controllers;
using StaffManagement.Persistence;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

public class UsersControllerTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{System.Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetUsers_ReturnsListOfUsers()
    {
        // Arrange
        var db = CreateInMemoryDb();

        db.Users.Add(new StaffManagement.Persistence.Entities.User
        {
            Id = 1,
            DisplayName = "John Doe",

            // REQUIRED FIELDS
            CognitoSub = "sub-1",
            Email = "john@example.com",
            Username = "john",
            Status = "active"
        });

        db.Users.Add(new StaffManagement.Persistence.Entities.User
        {
            Id = 2,
            DisplayName = "Jane Smith",

            // REQUIRED FIELDS
            CognitoSub = "sub-2",
            Email = "jane@example.com",
            Username = "jane",
            Status = "active"
        });

        await db.SaveChangesAsync();

        var service = new UserService(db);
        var controller = new UsersController(service);

        // Act
        var result = await controller.GetUsers();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var users = okResult!.Value as List<object>;
        users.Should().NotBeNull();
        users!.Count.Should().Be(2);
    }
}
