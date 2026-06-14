using System.Collections.Generic;

namespace DataAccess.Entities
{
    public partial class Track
    {
        public string TrackId { get; set; }
        public string EventId { get; set; }
        public string AdminId { get; set; } 
        public string TrackName { get; set; }
        public bool IsActive { get; set; }

        public virtual Admin Admin { get; set; }
        public virtual Event Event { get; set; }
        public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();
        public virtual ICollection<MentorAssignment> MentorAssignments { get; set; } = new List<MentorAssignment>();
    }
}