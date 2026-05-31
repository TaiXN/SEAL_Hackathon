using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Judge
{
    public string Id { get; set; } = null!;

    public string CategoryId { get; set; } = null!;

    public string TeacherId { get; set; } = null!;

    public virtual Category Category { get; set; } = null!;

    public virtual Teacher Teacher { get; set; } = null!;
}
