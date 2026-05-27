using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Player
{
    public string PlayerId { get; set; } = null!;

    public string UniversityId { get; set; } = null!;

    public string StudentId { get; set; } = null!;

    public bool IsApproved { get; set; }

    public string AccountId { get; set; } = null!;

    public virtual Account Account { get; set; } = null!;

    public virtual University University { get; set; } = null!;

    public virtual ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
}
