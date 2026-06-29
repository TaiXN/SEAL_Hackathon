using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Team
{
    public class TeamMemberAPIViewModel
    {
        public string StudentId { get; set; }
        public string StudentName { get; set; }
        public bool IsLeader { get; set; }
    }
}