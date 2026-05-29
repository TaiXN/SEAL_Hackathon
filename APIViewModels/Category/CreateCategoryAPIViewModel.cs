using System.ComponentModel.DataAnnotations;

namespace APIViewModels.Category
{
    public class CreateCategoryAPIViewModel
    {
        [Required]
        public string CategoryName { get; set; }
        [Required]
        public string EventID { get; set; }
        [Required]
        public string MentorId { get; set; }
        [Required]
        [MinLength(1)]
        public List<CreateJudgeAPIViewModel> Judges { get; set; }

    }
    public class CreateJudgeAPIViewModel
    {
        [Required]
        public string TeacherId { get; set; }
    }
}
