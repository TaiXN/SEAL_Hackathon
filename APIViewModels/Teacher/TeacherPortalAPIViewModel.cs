using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Teacher
{
    public class TrackSimpleViewModel
    {
        public string TrackId { get; set; } = string.Empty;
        public string TrackName { get; set; } = string.Empty;
    }

    public class EventSummaryViewModel
    {
        public int TotalTeams { get; set; }
        public int SubmittedTeams { get; set; }
        public int PendingScoreTeams { get; set; }
        public int ScoredTeams { get; set; }
        public int MentorTeams { get; set; }
    }

    public class PortalEventListViewModel
    {
        public string EventId { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        public int Year { get; set; }
        public int CurrentRound { get; set; }
        public string CurrentRoundName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public DateTime? ScoringStartDate { get; set; }
        public DateTime? ScoringEndDate { get; set; }

        public List<TrackSimpleViewModel> JudgeTracks { get; set; } = new List<TrackSimpleViewModel>();
        public List<TrackSimpleViewModel> MentorTracks { get; set; } = new List<TrackSimpleViewModel>();
        public EventSummaryViewModel Summary { get; set; } = new EventSummaryViewModel();
    }

    public class RoleFlagsViewModel
    {
        public bool IsJudge { get; set; }
        public bool IsMentor { get; set; }
    }

    public class TeamInEventViewModel
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public string TrackId { get; set; } = string.Empty;
        public string TrackName { get; set; } = string.Empty;
        public string TopicName { get; set; } = string.Empty;
        public string RoundId { get; set; } = string.Empty;
        public string RoundName { get; set; } = string.Empty;

        public string? SubmissionId { get; set; }
        public string? UrlGithub { get; set; }
        public string? UrlDemo { get; set; }
        public string? UrlSlide { get; set; }

        public string LeaderEmail { get; set; } = string.Empty;

        public string SubmissionStatus { get; set; } = string.Empty;
        public string ScoringStatus { get; set; } = string.Empty;
        public double? Score { get; set; }
        public string? EvaluationId { get; set; }

        public bool CanScore { get; set; }
        public bool CanMentorContact { get; set; }

        public bool IsUrgentScoring { get; set; }
        public string UrgentMessage { get; set; } = string.Empty;
    }

    public class PortalEventDetailViewModel
    {
        public string EventId { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public int CurrentRound { get; set; }
        public string CurrentRoundName { get; set; } = string.Empty;

        public DateTime? ScoringStartDate { get; set; }
        public DateTime? ScoringEndDate { get; set; }

        public RoleFlagsViewModel Roles { get; set; } = new RoleFlagsViewModel();
        public List<TrackSimpleViewModel> JudgeTracks { get; set; } = new List<TrackSimpleViewModel>();
        public List<TrackSimpleViewModel> MentorTracks { get; set; } = new List<TrackSimpleViewModel>();
        public List<TeamInEventViewModel> Teams { get; set; } = new List<TeamInEventViewModel>();
    }
}