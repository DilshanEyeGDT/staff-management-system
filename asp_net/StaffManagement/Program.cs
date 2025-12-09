using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;
using StaffManagement.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<ScheduleService>();      // register ScheduleService
builder.Services.AddScoped<TaskService>();          // register TaskService
builder.Services.AddScoped<ImportService>();        // register ImportJobsService
builder.Services.AddScoped<UserService>();          // register userServices

builder.Services.AddScoped<TrainingCourseService>();    // register TrainingCourses
builder.Services.AddScoped<TrainingAssignmentService>(); // register TrainingAssignmentService
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<KpiTargetService>();
builder.Services.AddScoped<KpiMetricsService>();
builder.Services.AddScoped<IPerformanceService, PerformanceService>();

// Database connection
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // React dev server
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use CORS BEFORE Authorization and MapControllers
app.UseCors("AllowReactApp");

app.UseAuthorization();
app.MapControllers();

app.Run();
