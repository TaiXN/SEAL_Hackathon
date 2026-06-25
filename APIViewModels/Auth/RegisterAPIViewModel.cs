using System.ComponentModel.DataAnnotations;

namespace APIViewModels.Auth
{
    public class RegisterAPIViewModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = null!;

        [Required]
        public string FullName { get; set; } = null!;

        [Required]
       
        public string Address { get; set; } = null!;

        [Required]
        [Phone]
        public string Phone { get; set; } = null!;

        [Required]

      
        public string UniversityId { get; set; } = null!;
    }
}