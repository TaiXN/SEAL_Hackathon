using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class CriteriaSet
{
    public string CriteriaSetId { get; set; } = null!;

    public string SetName { get; set; } = null!;

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
}
