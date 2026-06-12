using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Mapping
{
    public string CriteriaSetId { get; set; } = null!;

    public string CriteriaId { get; set; } = null!;

    public int Score { get; set; }

    public virtual Criterion Criteria { get; set; } = null!;

    public virtual CriteriaSet CriteriaSet { get; set; } = null!;
}
