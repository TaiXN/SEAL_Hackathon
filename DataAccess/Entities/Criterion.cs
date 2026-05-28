using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Criterion
{
    public string CriteriaId { get; set; } = null!;

    public string RoundId { get; set; } = null!;

    public string CriteriaName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public double Weight { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();

    public virtual Round Round { get; set; } = null!;
}
