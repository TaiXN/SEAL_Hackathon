using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Mapping
{
    public string CriteriaTemplateId { get; set; } = null!;

    public string CriteriaId { get; set; } = null!;

    public int Score { get; set; }

    public virtual Criterion Criteria { get; set; } = null!;

    public virtual CriteriaTemplate CriteriaTemplate { get; set; } = null!;
}
