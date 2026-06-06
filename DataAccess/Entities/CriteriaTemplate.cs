using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class CriteriaTemplate
{
    public string CriteriaTemplateId { get; set; } = null!;

    public string TemplateName { get; set; } = null!;

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Event> Events { get; set; } = new List<Event>();

    public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();
}
