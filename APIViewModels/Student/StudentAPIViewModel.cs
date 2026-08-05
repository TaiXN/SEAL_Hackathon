namespace APIViewModels.Student 
{
    public class StudentAPIViewModel
    {
        public string StudentId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string UniversityName { get; set; }
        public string? IdCardImageUrl { get; set; }
        public string? CccdNumber { get; set; }

        public string? StudentCardImageUrl { get; set; }

        public bool IsActive { get; set; }
    }
}