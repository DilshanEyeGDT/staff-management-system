using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Services
{
    public class TrainingCourseService
    {
        private readonly AppDbContext _db;

        public TrainingCourseService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(List<TrainingCourseDto> courses, int totalCount)>
            GetCoursesAsync(string? query, int page, int size)
        {
            var q = _db.TrainingCourses.AsQueryable();

            // Search
            if (!string.IsNullOrWhiteSpace(query))
            {
                string lower = query.ToLower();
                q = q.Where(c =>
                    c.Title.ToLower().Contains(lower) ||
                    c.Description.ToLower().Contains(lower) ||
                    c.Category.ToLower().Contains(lower)
                );
            }

            // Count
            int totalCount = await q.CountAsync();

            // Pagination
            var courses = await q
                .OrderBy(c => c.Title)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(c => new TrainingCourseDto
                {
                    CourseId = c.CourseId,
                    Title = c.Title,
                    Description = c.Description,
                    Category = c.Category,
                    DurationHours = c.DurationHours,
                    Link = c.Link,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return (courses, totalCount);
        }
    }
}
