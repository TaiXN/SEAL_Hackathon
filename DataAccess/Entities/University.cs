using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Entities
{
    public string UniversityId { get; set; } = null!;

    public string UniversityName { get; set; } = null!;

    public virtual ICollection<Student> Students { get; set; } = new List<Student>();
}
