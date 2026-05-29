using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Teacher
{
    public string Id { get; set; } = null!;

    public bool IsGuest { get; set; }

    public string AccountId { get; set; } = null!;

    public virtual Account Account { get; set; } = null!;

    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();

    public virtual ICollection<Judge> Judges { get; set; } = new List<Judge>();
}
