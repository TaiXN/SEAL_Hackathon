using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Entities
{
    [Table("University")]
    public class University
    {
        [Key]
        public string UniversityId { get; set; }
        public string UniversityName { get; set; }
        public virtual ICollection<Student> Students { get; set; }
    }
}