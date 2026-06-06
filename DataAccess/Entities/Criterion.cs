using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Criterion
{
    public string CriteriaId { get; set; } = null!;

    public string CriteriaName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();
}
