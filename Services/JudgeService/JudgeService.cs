using APIViewModels.Category;
using APIViewModels.Judge;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.JudgeService
{
    public class JudgeService : IJudgeService
    {
        private readonly IUnitOfWork _uow;
        public JudgeService(IUnitOfWork uow)
        {
            _uow = uow;
        }
        public async Task<bool> RemoveJudgeAsync(RemoveJudgeAPIViewModel judgeInfo)
        {
            //categroy
            try
            {
                Category cate = await _uow.Category.GetFirstOrDefaultAsync(q => q.CategoryId == judgeInfo.CategoryId);
                if (cate != null)
                {
                    //check Judge exist
                    Judge judge = await _uow.Judge.GetFirstOrDefaultAsync(q => q.TeacherId == judgeInfo.TeacherId && q.CategoryId == judgeInfo.CategoryId);
                    if (judge != null)
                    {
                        _uow.Judge.Remove(judge);
                        await _uow.SaveAsync();
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
                else return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<string> AddJudgeAsync(AddJudgeAPIViewModel judgesInfo)
        {
            try
            {
                //check category exist
                Category cate = await _uow.Category.GetFirstOrDefaultAsync(q => q.CategoryId == judgesInfo.CategoryId, "Judges");
                if (cate != null)
                {
                    foreach (CreateJudgeAPIViewModel judge in judgesInfo.NewJudges)
                    {
                        if (judge.TeacherId == cate.Mentor)
                        {
                            return $"Judge {judge.TeacherId} is already a mentor";
                        }
                        //check judge is teacher exist
                        Teacher existed = await _uow.Teacher.GetFirstOrDefaultAsync(q => q.Id == judge.TeacherId);
                        if (existed != null)
                        {
                            //check duplicate

                            Judge judgeDb = cate.Judges.Where(q => q.TeacherId == judge.TeacherId).FirstOrDefault();
                            if (judgeDb == null)
                            {
                                Judge newJudge = new Judge()
                                {
                                    Id = Guid.NewGuid().ToString(),
                                    CategoryId = judgesInfo.CategoryId,
                                    TeacherId = judge.TeacherId
                                };
                                await _uow.Judge.AddAsync(newJudge);
                            }
                            else
                            {
                                return $"Judge {judgeDb.TeacherId} is already assgined";
                            }
                        }
                        else
                        {
                            return $"Judge {judge.TeacherId} is not existed";
                        }

                    }
                    await _uow.SaveAsync();
                    return "Ok";
                }
                else
                {
                    return string.Empty;
                }
            }
            catch (Exception ex)
            {
                return string.Empty;
            }

        }

        public async Task<List<JudgeAPIViewModel>> GetByCategoryIdAsync(string cateId, string eventId)
        {
            Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(q => q.EventId == eventId && q.IsActive);
            if (eventDb == null) return null;

            List<Judge> judgeDb = await _uow.Judge.GetAllAsync(q => q.CategoryId == cateId,null, "Category,Teacher");
            if (judgeDb != null)
            {
                List<JudgeAPIViewModel> result = new List<JudgeAPIViewModel>();
                foreach(Judge judge in judgeDb)
                {
                    Account account = await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId == judge.Teacher.AccountId);
                    result.Add(new JudgeAPIViewModel()
                    {
                        AccId = account.AccountId,
                        CategoryId = judge.CategoryId,
                        Email = account.Email,
                        Fullname = account.FullName,
                        Id = judge.Id,
                        IsGuest = judge.Teacher.IsGuest,
                        TeacherId = judge.TeacherId,
                        CategoryName = judge.Category.CategoryName
                    });
                }
          
                return result;

            }
            else
            {
                return null;
            }
        }
    }
}
