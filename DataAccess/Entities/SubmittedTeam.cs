using System;

namespace DataAccess.Entities
{
    public partial class SubmittedTeam
    {
        public string SubmittedTeamId { get; set; }
        public string TeamId { get; set; }
        public string TrackId { get; set; }
        public string TopicId { get; set; }

        public DateTime SubmitTime { get; set; }
        public virtual Team Team { get; set; }
    }
}