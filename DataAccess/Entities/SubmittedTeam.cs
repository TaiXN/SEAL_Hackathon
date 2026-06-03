using System;
using System.Collections.Generic;

namespace DataAccess.Entities
{
    public partial class SubmittedTeam
    {
        public string SubmittedTeamId { get; set; }
        public string TeamId { get; set; }
        public string CategoryId { get; set; }
        public string TopicName { get; set; }
        public string? Description { get; set; }
        public DateTime SubmitTime { get; set; }

        public virtual Category Category { get; set; }
        public virtual Team Team { get; set; }
    }
}