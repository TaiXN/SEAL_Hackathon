using APIViewModels.Teacher;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Services.TeacherService
{
    public class TeacherService : ITeacherService
    {
        private readonly IUnitOfWork _uow;
        private readonly string PRIVATEKEY = "dasox!@#!mxosnadoxnWCASDASCDASXD12312-123!@#!@#!@";
        public TeacherService(IUnitOfWork uow)
        {
            _uow = uow;
        }


        private async Task<bool> IsDuplicateEmail(string email)
        {
            Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(q => q.Email.ToLower().Equals(email.ToLower()));
            if (accountDb == null)
            {
                return false;
            }
            else
            {
                return true;
            }
        }

        public async Task<bool> CreateAsync(Account account, bool isGuest)
        {
            try
            {
                if (!(await IsDuplicateEmail(account.Email)))
                {
                    string hashedPassword = HashBuilder.ComputeSha256Hash(account.Password + PRIVATEKEY);
                    string roleId = (await _uow.Role.GetFirstOrDefaultAsync(q => q.RoleName.Equals("Teacher"))).RoleId;
                    Account newAccount = new Account()
                    {
                        AccountId = account.AccountId,
                        Address = account.Address,
                        Email = account.Email,
                        IsActive = true,
                        FullName = account.FullName,
                        Password = hashedPassword,
                        Phone = account.Phone,
                        RoleId = roleId

                    };
                    await _uow.Account.AddAsync(newAccount);
                    Teacher newTeacher = new Teacher()
                    {
                        Id = newAccount.AccountId,
                        IsGuest = isGuest
                    };
                    await _uow.Teacher.AddAsync(newTeacher);
                    await _uow.SaveAsync();
                    return true;

                }
                else return false;


            }
            catch (Exception ex)
            {
                return false;
            }

        }

        public async Task<List<TeacherAPIViewModel>> GetAllTeacherListAsync()
        {
            try
            {

                List<TeacherList> teachers = await _uow.TeacherList.GetAllAsync();

                List<TeacherAPIViewModel> result = new List<TeacherAPIViewModel>();


                foreach (TeacherList teacher in teachers)
                {

                    Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == teacher.TeacherId);


                    TeacherAPIViewModel newTeacher = new TeacherAPIViewModel()
                    {
                        TeacherId = teacher.TeacherId,
                        TrackId = teacher.TrackId,
                        IsMentor = teacher.IsMentor,
                    };

                    if (accountDb != null)
                    {
                        newTeacher.TeacherName = accountDb.FullName;
                    }
                    else
                    {
                        newTeacher.TeacherName = "Unknown Teacher";
                    }

                    result.Add(newTeacher);
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<TeacherAPIViewModel>();
            }
        }

        public async Task<List<TeacherInfoAPIVIewModel>> GetAllAvailableTeachersAsync()
        {
            try
            {

                IEnumerable<Teacher> teachers = await _uow.Teacher.GetAllAsync();

                List<TeacherInfoAPIVIewModel> result = new List<TeacherInfoAPIVIewModel>();

                foreach (Teacher t in teachers)
                {
                    Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == t.Id && a.IsActive);

                    if (accountDb != null)
                    {
                        TeacherInfoAPIVIewModel model = new TeacherInfoAPIVIewModel()
                        {
                            TeacherId = t.Id,
                            TeacherName = accountDb.FullName,
                            Email = accountDb.Email,
                            IsGuest = t.IsGuest
                        };

                        result.Add(model);
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<TeacherInfoAPIVIewModel>();
            }
        }

        public async Task<Teacher> GetByIdAsync(string id)
        {
            try
            {
                return await _uow.Teacher.GetFirstOrDefaultAsync(e => e.Id == id);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateAsync(string id, Account updatedAccount, bool isGuest)
        {
            try
            {
                Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId.Equals(id));
                if (accountDb == null)
                {
                    return false;
                }

                if (accountDb.Email.ToLower() != updatedAccount.Email.ToLower())
                {
                    Account checkEmail = await _uow.Account.GetFirstOrDefaultAsync(e => e.Email.ToLower() == updatedAccount.Email.ToLower() && e.AccountId != id);
                    if (checkEmail != null) return false;
                    accountDb.Email = updatedAccount.Email;
                }

                accountDb.FullName = updatedAccount.FullName;
                accountDb.Address = updatedAccount.Address;
                accountDb.Phone = updatedAccount.Phone;
                _uow.Account.Update(accountDb);

                Teacher teacherDb = await _uow.Teacher.GetFirstOrDefaultAsync(q => q.Id.Equals(id));
                if (teacherDb != null)
                {
                    teacherDb.IsGuest = isGuest;
                    _uow.Teacher.Update(teacherDb);
                }

                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteAsync(string id)
        {
            try
            {
                Account result = await _uow.Account.GetFirstOrDefaultAsync(e => e.AccountId.Equals(id));
                if (result == null) return false;

                result.IsActive = false;
                _uow.Account.Update(result);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        // =========================================================================
        // PHẦN API DÀNH CHO TEACHER PORTAL (JUDGE & MENTOR DASHBOARD)
        // =========================================================================

        public async Task<List<PortalEventListViewModel>> GetPortalEventsAsync(string teacherId)
        {
            try
            {
                List<PortalEventListViewModel> result = new List<PortalEventListViewModel>();

                List<Event> events = await _uow.Event.GetAllQueryable()
                                               .Where(e => e.IsActive && e.CurrentRound >= 1)
                                               .ToListAsync();

                foreach (Event ev in events)
                {
                    Round currentRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == ev.EventId && r.RoundIndex == ev.CurrentRound);

                    if (currentRound == null)
                    {
                        continue;
                    }

                    List<TrackSimpleViewModel> judgeTracks = await GetTeacherTracksAsync(teacherId, ev.EventId, false);
                    List<TrackSimpleViewModel> mentorTracks = await GetTeacherTracksAsync(teacherId, ev.EventId, true);

                    if (judgeTracks.Count == 0 && mentorTracks.Count == 0)
                    {
                        continue;
                    }

                    List<TeamInRound> teamsInRound = await _uow.TeamInRound.GetAllQueryable()
                                                               .Where(t => t.RoundId == currentRound.RoundId && t.IsCheck && !t.IsBanned)
                                                               .ToListAsync();

                    List<string> teamIds = teamsInRound.Select(t => t.Id).ToList();

                    List<Submission> submissions = await _uow.Submission.GetAllQueryable()
                                                             .Where(s => teamIds.Contains(s.TeamInRoundId))
                                                             .ToListAsync();

                    List<Evaluation> evaluations = await _uow.Evaluation.GetAllQueryable()
                                                               .Where(e => submissions.Select(s => s.Id).Contains(e.SubmissionId) && e.TeacherId == teacherId)
                                                               .ToListAsync();

                    List<string> mentorTrackIds = mentorTracks.Select(m => m.TrackId).ToList();
                    int mentorTeamsCount = teamsInRound.Count(t => mentorTrackIds.Contains(t.TrackId));

                    EventSummaryViewModel summary = new EventSummaryViewModel
                    {
                        TotalTeams = teamsInRound.Count,
                        SubmittedTeams = submissions.Count,
                        PendingScoreTeams = submissions.Count - evaluations.Count,
                        ScoredTeams = evaluations.Count,
                        MentorTeams = mentorTeamsCount
                    };

                    PortalEventListViewModel eventViewModel = new PortalEventListViewModel
                    {
                        EventId = ev.EventId,
                        EventName = ev.EventName,
                        Season = ev.Season,
                        Year = ev.Year,
                        CurrentRound = ev.CurrentRound,
                        CurrentRoundName = currentRound.RoundName,
                        StartDate = currentRound.StartDate,
                        EndDate = currentRound.EndDate,
                        JudgeTracks = judgeTracks,
                        MentorTracks = mentorTracks,
                        Summary = summary
                    };

                    result.Add(eventViewModel);
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<PortalEventListViewModel>();
            }
        }

        public async Task<PortalEventDetailViewModel> GetPortalEventDetailAsync(string teacherId, string eventId)
        {
            try
            {
                Event ev = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == eventId && e.IsActive);
                if (ev == null) return null;

                Round currentRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == eventId && r.RoundIndex == ev.CurrentRound);
                if (currentRound == null) return null;

                List<TrackSimpleViewModel> judgeTracks = await GetTeacherTracksAsync(teacherId, eventId, false);
                List<TrackSimpleViewModel> mentorTracks = await GetTeacherTracksAsync(teacherId, eventId, true);

                PortalEventDetailViewModel detail = new PortalEventDetailViewModel
                {
                    EventId = ev.EventId,
                    EventName = ev.EventName,
                    CurrentRound = ev.CurrentRound,
                    CurrentRoundName = currentRound.RoundName,
                    Roles = new RoleFlagsViewModel
                    {
                        IsJudge = judgeTracks.Count > 0,
                        IsMentor = mentorTracks.Count > 0
                    },
                    JudgeTracks = judgeTracks,
                    MentorTracks = mentorTracks,
                    Teams = new List<TeamInEventViewModel>()
                };

                List<TeamInRound> teamsInRound = await _uow.TeamInRound.GetAllQueryable()
                                                           .Include(t => t.Team)
                                                           .Include(t => t.Track)
                                                           .Where(t => t.RoundId == currentRound.RoundId && t.IsCheck && !t.IsBanned)
                                                           .ToListAsync();

                List<string> teamIds = teamsInRound.Select(t => t.Id).ToList();

                List<Submission> submissions = await _uow.Submission.GetAllQueryable()
                                                         .Where(s => teamIds.Contains(s.TeamInRoundId))
                                                         .ToListAsync();

                List<Evaluation> evaluations = await _uow.Evaluation.GetAllQueryable()
                                                         .Where(e => submissions.Select(s => s.Id).Contains(e.SubmissionId) && e.TeacherId == teacherId)
                                                         .ToListAsync();

                foreach (TeamInRound tir in teamsInRound)
                {
                    Submission submission = submissions.FirstOrDefault(s => s.TeamInRoundId == tir.Id);
                    Evaluation evaluation = null;

                    if (submission != null)
                    {
                        evaluation = evaluations.FirstOrDefault(e => e.SubmissionId == submission.Id);
                    }

                    bool isTrackJudge = judgeTracks.Any(j => j.TrackId == tir.TrackId);
                    bool isTrackMentor = mentorTracks.Any(m => m.TrackId == tir.TrackId);

                    if (isTrackJudge == false && isTrackMentor == false)
                    {
                        continue;
                    }

                    TeamInEventViewModel teamView = new TeamInEventViewModel
                    {
                        TeamId = tir.TeamId,
                        TeamName = tir.Team != null ? tir.Team.TeamName : "Unknown",
                        TrackId = tir.TrackId,
                        TrackName = tir.Track != null ? tir.Track.TrackName : "Unknown",
                        TopicName = "N/A",
                        RoundId = currentRound.RoundId,
                        RoundName = currentRound.RoundName,

                        SubmissionId = submission != null ? submission.Id : null,
                        UrlGithub = submission != null ? submission.Urlgithub : null,
                        UrlDemo = submission != null ? submission.Urldemo : null,
                        UrlSlide = submission != null ? submission.Urlslide : null,

                        LeaderEmail = "leader@gmail.com",

                        SubmissionStatus = submission != null ? "Submitted" : "Not Submitted",
                        ScoringStatus = evaluation != null ? "Scored" : "Pending",
                        Score = evaluation != null ? evaluation.Score : null,
                        EvaluationId = evaluation != null ? evaluation.Id : null,

                        CanScore = isTrackJudge && submission != null && evaluation == null,
                        CanMentorContact = isTrackMentor
                    };

                    detail.Teams.Add(teamView);
                }

                return detail;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        private async Task<List<TrackSimpleViewModel>> GetTeacherTracksAsync(string teacherId, string eventId, bool isMentor)
        {
            List<TrackSimpleViewModel> result = await _uow.TeacherList.GetAllQueryable()
                     .Include(t => t.Track)
                     .Where(t => t.TeacherId == teacherId
                              && t.IsMentor == isMentor
                              && t.Track.EventId == eventId)
                     .Select(t => new TrackSimpleViewModel
                     {
                         TrackId = t.TrackId,
                         TrackName = t.Track != null ? t.Track.TrackName : string.Empty
                     })
                     .ToListAsync();

            return result;
        }
    }
}
