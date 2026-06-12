using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Admin
{
    public string AdminId { get; set; } = null!;

    public bool IsSuperAdmin { get; set; }

    public virtual Account AdminNavigation { get; set; } = null!;
}
