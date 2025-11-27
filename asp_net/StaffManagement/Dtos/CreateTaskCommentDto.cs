namespace StaffManagement.Dtos
{
    public class CreateTaskCommentDto
    {
        public int CreatedByUserId { get; set; }  // who is writing the comment
        public string Content { get; set; }       // comment text
    }
}
