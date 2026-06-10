using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Teacher
{
    public string Id { get; set; } = null!;

    public bool IsGuest { get; set; }

    public string AccountId { get; set; } = null!;

    public virtual Account Account { get; set; } = null!;

    public virtual ICollection<JudgeAssignment> JudgeAssignments { get; set; } = new List<JudgeAssignment>();

    public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();

    public virtual ICollection<MentorAssignment> MentorAssignments { get; set; } = new List<MentorAssignment>();
}
