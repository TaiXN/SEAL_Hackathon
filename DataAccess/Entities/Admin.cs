using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Admin
{
    public string AdminId { get; set; } = null!;

    public string AccountId { get; set; } = null!;

    public virtual Account Account { get; set; } = null!;
}
