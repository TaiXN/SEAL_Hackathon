using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class University
{
    public string UniversityId { get; set; } = null!;

    public string UniversityName { get; set; } = null!;

    public virtual ICollection<Player> Players { get; set; } = new List<Player>();
}
