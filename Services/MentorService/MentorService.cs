using APIViewModels.Mentor;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
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
        public async Task<TeamMentorContactAPIViewModel> GetMentorContactByTeamAsync(string teamId)
        {
            try
            {
                TeamInRound teamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == teamId);
                if (teamInRound == null) return null;

                string currentTrackId = teamInRound.TrackId;

                TeacherList mentorLink = await _uow.TeacherList.GetFirstOrDefaultAsync(t => t.TrackId == currentTrackId && t.IsMentor == true);
                if (mentorLink == null) return null;

                Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == mentorLink.TeacherId);
                if (accountDb == null) return null;

                return new TeamMentorContactAPIViewModel
                {
                    MentorId = accountDb.AccountId,
                    FullName = accountDb.FullName,
                    Email = accountDb.Email,
                    Phone = accountDb.Phone
                };
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}
