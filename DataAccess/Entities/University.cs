using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class University
{
    public string UniversityId { get; set; } = null!;

    public string UniversityName { get; set; } = null!;

    public virtual ICollection<Student> Students { get; set; } = new List<Student>();
}
