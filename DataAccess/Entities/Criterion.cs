using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Criterion
{
    public string CriteriaId { get; set; } = null!;

    public string CriteriaName { get; set; } = null!;

    public int Score { get; set; }

    public string RoundId { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual Round Round { get; set; } = null!;
}
