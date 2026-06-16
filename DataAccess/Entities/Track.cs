using System.Collections.Generic;

namespace DataAccess.Entities
{
    public partial class Track
    {
        public string TrackId { get; set; } = null!;
        public string EventId { get; set; } = null!;
        public string Creator { get; set; } = null!;
        public string TrackName { get; set; } = null!;
        public bool IsActive { get; set; }

        public virtual Event Event { get; set; } = null!;
    }
}