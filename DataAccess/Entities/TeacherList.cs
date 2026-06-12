using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class TeacherList
{
    public string TeacherId { get; set; } = null!;

    public string TrackId { get; set; } = null!;

    public bool IsMentor { get; set; }

    public virtual Teacher Teacher { get; set; } = null!;

    public virtual Track Track { get; set; } = null!;
}
