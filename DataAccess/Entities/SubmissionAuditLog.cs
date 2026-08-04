using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Entities
{
    public class SubmissionAuditLog
    {
        public string Id { get; set; } = null!;
        public string SubmissionId { get; set; } = null!;
        public string TeamId { get; set; } = null!;
        public string EventId { get; set; } = null!;
        public string RoundId { get; set; } = null!;

        public string? OldUrlGithub { get; set; }
        public string? OldUrlDemo { get; set; }
        public string? OldUrlSlide { get; set; }

        public string NewUrlGithub { get; set; } = null!;
        public string NewUrlDemo { get; set; } = null!;
        public string NewUrlSlide { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
    }
}
