using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Mapping
{
    public string MappingId { get; set; } = null!;

    public string TrackId { get; set; } = null!;
    public string EventId { get; set; } = null!;
    public string MentorId { get; set; } = null!;

    public virtual Track Track { get; set; } = null!;
    public virtual Event Event { get; set; } = null!;
}