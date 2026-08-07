using APIViewModels.Mentor;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.MentorService
{
    public class MentorService : IMentorService
    {
        private readonly IUnitOfWork _uow;
        public MentorService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> AddMentor(string mentorID, string trackID)
        {
            try
            {
                TeacherList newMentor = new TeacherList()
                {
                    TeacherId = mentorID,
                    TrackId = trackID,
                    IsMentor = true
                };

                await _uow.TeacherList.AddAsync(newMentor);

                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<MentorAPIViewModel>> GetAllMentorsAsync()
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.IsMentor);

                return result.Select(m => new MentorAPIViewModel
                {
                    TeacherId = m.TeacherId,
                    TrackId = m.TrackId,
                    IsMentor = m.IsMentor
                }).ToList();
            }
            catch
            {
                return new List<MentorAPIViewModel>();
            }
        }

        public async Task<List<MentorAPIViewModel>> GetMentorsByTrackAsync(string trackID)
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.TrackId == trackID && q.IsMentor);

                return result.Select(m => new MentorAPIViewModel
                {
                    TeacherId = m.TeacherId,
                    TrackId = m.TrackId,
                    IsMentor = m.IsMentor
                }).ToList();
            }
            catch
            {
                return new List<MentorAPIViewModel>();
            }
        }

        public async Task<bool> RemoveMentor(string teacherID, string trackID)
        {
            try
            {
                TeacherList listDb = await _uow.TeacherList.GetFirstOrDefaultAsync(q => q.TeacherId == teacherID && q.TrackId == trackID && q.IsMentor);

                if (listDb == null)
                {
                    return false;
                }

                _uow.TeacherList.Remove(listDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (System.Exception ex)
            {
                return false;
            }
        }

        public async Task<List<MentorAssignedTeamAPIViewModel>> GetAssignedTeamsByMentorAsync(string mentorId)
        {
            try
            {
                List<TeacherList> teacherLists = await _uow.TeacherList.GetAllAsync(q => q.TeacherId == mentorId && q.IsMentor == true);

                if (teacherLists == null)
                {
                    return null;
                }

                List<string> trackIds = teacherLists.Select(t => t.TrackId).ToList();

                List<TeamInRound> teamsInRound = await _uow.TeamInRound.GetAllAsync(tr => trackIds.Contains(tr.TrackId));

                List<MentorAssignedTeamAPIViewModel> result = new List<MentorAssignedTeamAPIViewModel>();

                foreach (TeamInRound tr in teamsInRound)
                {
                    if (result.Any(r => r.TeamId == tr.TeamId)) continue;

                    Team teamDb = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == tr.TeamId);
                    Track trackDb = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == tr.TrackId);

                    if (teamDb != null && trackDb != null)
                    {
                        string eventName = string.Empty;
                        Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == trackDb.EventId);

                        if (eventDb != null)
                        {
                            eventName = eventDb.EventName;
                        }

                        result.Add(new MentorAssignedTeamAPIViewModel
                        {
                            TeamId = teamDb.TeamId,
                            TeamName = teamDb.TeamName,
                            TrackId = trackDb.TrackId,
                            TrackName = trackDb.TrackName,
                            EventName = eventName
                        });
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public async Task<List<TeamMentorContactAPIViewModel>> GetMentorContactByTeamAsync(string teamId, string eventId)
        {
            try
            {

                TeamInRound teamInRound =
                    await _uow.TeamInRound
                        .GetAllQueryable()
                        .Include(tr => tr.Track)
                        .FirstOrDefaultAsync(tr =>
                            tr.TeamId == teamId &&
                            tr.Track != null &&
                            tr.Track.EventId == eventId);

                if (teamInRound == null)
                {
                    return new List<TeamMentorContactAPIViewModel>();
                }

                string currentTrackId = teamInRound.TrackId;

                List<TeacherList> mentorLinks =
                    await _uow.TeacherList.GetAllAsync(
                        t => t.TrackId == currentTrackId &&
                             t.IsMentor == true);

                if (mentorLinks == null || !mentorLinks.Any())
                {
                    return new List<TeamMentorContactAPIViewModel>();
                }

                List<TeamMentorContactAPIViewModel> result =
                    new List<TeamMentorContactAPIViewModel>();

                foreach (TeacherList mentorLink in mentorLinks)
                {
                    Account accountDb =
                        await _uow.Account.GetFirstOrDefaultAsync(
                            a => a.AccountId == mentorLink.TeacherId);

                    if (accountDb == null)
                    {
                        continue;
                    }

                    result.Add(new TeamMentorContactAPIViewModel
                    {
                        MentorId = accountDb.AccountId,
                        FullName = accountDb.FullName,
                        Email = accountDb.Email,
                        Phone = accountDb.Phone
                    });
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<TeamMentorContactAPIViewModel>();
            }
        }

        public async Task<MentorTeamDetailAPIViewModel> GetTeamDetailForMentorAsync(string teamId)
        {
            try
            {
                Team teamDb = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
                if (teamDb == null) return null;

                TeamInRound teamInRoundDb = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == teamId);

                string roundName = string.Empty;
                string trackName = string.Empty;
                string eventName = string.Empty;

                string urlGithub = string.Empty;
                string urlDemo = string.Empty;
                string urlSlide = string.Empty;

                if (teamInRoundDb != null)
                {
                    Submission submissionDb = await _uow.Submission.GetFirstOrDefaultAsync(s => s.TeamInRoundId == teamInRoundDb.Id);

                    if (submissionDb != null)
                    {
                        urlGithub = submissionDb.Urlgithub;
                        urlDemo = submissionDb.Urldemo;
                        urlSlide = submissionDb.Urlslide;
                    }

                    Round roundDb = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == teamInRoundDb.RoundId);
                    if (roundDb != null)
                    {
                        roundName = roundDb.RoundName;
                    }

                    Track trackDb = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == teamInRoundDb.TrackId);
                    if (trackDb != null)
                    {
                        trackName = trackDb.TrackName;

                        Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == trackDb.EventId);
                        if (eventDb != null)
                        {
                            eventName = eventDb.EventName;
                        }
                    }
                }

                List<string> memberNames = new List<string>();
                List<string> processedStudentIds = new List<string>();
                string leaderEmail = string.Empty;

                List<TeamMember> teamMembersDb = await _uow.TeamMember.GetAllAsync(m => m.TeamId == teamId && m.InviteStatus == true);

                foreach (TeamMember tm in teamMembersDb)
                {
                    if (processedStudentIds.Contains(tm.StudentId))
                    {
                        continue;
                    }

                    processedStudentIds.Add(tm.StudentId);

                    Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == tm.StudentId);

                    if (accountDb != null)
                    {
                        string displayName = accountDb.FullName;

                        if (tm.IsLeader == true)
                        {
                            displayName += " (Leader)";
                            leaderEmail = accountDb.Email;
                        }

                        memberNames.Add(displayName);
                    }
                }

   
                MentorTeamDetailAPIViewModel result = new MentorTeamDetailAPIViewModel()
                {
                    TeamId = teamDb.TeamId,
                    TeamName = teamDb.TeamName,
                    EventName = eventName,
                    TrackName = trackName,
                    RoundName = roundName,

                    UrlGithub = urlGithub,
                    UrlDemo = urlDemo,
                    UrlSlide = urlSlide,

                    LeaderEmail = leaderEmail,
                    MemberNames = memberNames
                };

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

    }
}
