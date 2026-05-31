using APIViewModels.Category;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;

namespace Services.CategoryService
{
    public class CategoryService : ICategoryService
    {
        private readonly IUnitOfWork _uow;
        public CategoryService(IUnitOfWork uow)
        {
            _uow = uow;
        }
        public async Task<List<BasicCategoryAPIViewModel>> GetAllByEventIdAsync(string id,bool isActive)
        {
            //check exist event 
            List<Category> categories = await _uow.Category.GetAllAsync(q => q.EventId == id && q.IsActive == isActive, null, "Event,MentorNavigation");
            if (categories != null && categories.Count > 0)
            {
                List<BasicCategoryAPIViewModel> result = new List<BasicCategoryAPIViewModel>();
                foreach (Category cate in categories)
                {
                    Account mentorAcc = await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId == cate.MentorNavigation.AccountId);
                    result.Add(new BasicCategoryAPIViewModel()
                    {
                        CategoryId = cate.CategoryId,
                        CategoryName = cate.CategoryName,
                        Event = new APIViewModels.Event.BasicEventAPIViewModel()
                        {
                            Id = cate.Event.EventId,
                            Name = cate.Event.EventName
                        },
                        IsActive = cate.IsActive,
                        Mentor = new APIViewModels.Mentor.MentorAPIViewModel()
                        {
                            Id = cate.Mentor,
                            Email = mentorAcc.Email,
                            Name = mentorAcc.FullName
                        }
                    });
                }
                return result;
            }
            else
            {
                return new List<BasicCategoryAPIViewModel>();
            }
        }

        public async Task<List<BasicCategoryAPIViewModel>> GetAllByEventIdAsync(string id)
        {
            //check exist event 
            List<Category> categories = await _uow.Category.GetAllAsync(q => q.EventId == id,null, "Event,MentorNavigation");
            if (categories != null && categories.Count > 0)
            {
                List<BasicCategoryAPIViewModel> result = new List<BasicCategoryAPIViewModel>();
                foreach(Category cate in categories)
                {
                    Account mentorAcc = await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId == cate.MentorNavigation.AccountId);
                    result.Add(new BasicCategoryAPIViewModel()
                    {
                        CategoryId = cate.CategoryId,
                        CategoryName = cate.CategoryName,
                        Event = new APIViewModels.Event.BasicEventAPIViewModel()
                        {
                            Id = cate.Event.EventId,
                            Name = cate.Event.EventName
                        },
                        IsActive = cate.IsActive,
                        Mentor = new APIViewModels.Mentor.MentorAPIViewModel()
                        {
                            Id = cate.Mentor,
                            Email = mentorAcc.Email,
                            Name = mentorAcc.FullName
                        }
                    });
                }
                return result;
            }
            else
            {
                return new List<BasicCategoryAPIViewModel>();
            }
        }

        private async Task<bool> IsDuplicate(string categoryName)
        {
            Category cateDb = await _uow.Category.GetFirstOrDefaultAsync(q => q.CategoryName.ToLower().Equals(categoryName.ToLower()));
            if (cateDb == null)
            {
                return false;
            }
            else
            {
                return true;
            }
        }

        public async Task<bool> RemoveJudgeAsync(RemoveJudgeAPIViewModel judgeInfo)
        {
            //categroy
            try
            {
                Category cate = await _uow.Category.GetFirstOrDefaultAsync(q=> q.CategoryId == judgeInfo.CategoryId);
                if (cate != null)
                {
                    //check Judge exist
                    Judge judge = await _uow.Judge.GetFirstOrDefaultAsync(q=> q.TeacherId == judgeInfo.TeacherId && q.CategoryId == judgeInfo.CategoryId);
                    if(judge != null)
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
            catch(Exception ex)
            {
                return false;
            }
        }
        public async Task<string> AddJudgeAsync(AddJudgeAPIViewModel judgesInfo)
        {
            try
            {
                //check category exist
                Category cate = await _uow.Category.GetFirstOrDefaultAsync(q=> q.CategoryId == judgesInfo.CategoryId, "Judges");
                if(cate != null)
                {
                    foreach(CreateJudgeAPIViewModel judge in judgesInfo.NewJudges)
                    {
                        if(judge.TeacherId == cate.Mentor)
                        {
                            return $"Judge {judge.TeacherId} is already a mentor";
                        }
                        //check judge is teacher exist
                        Teacher existed = await _uow.Teacher.GetFirstOrDefaultAsync(q => q.Id == judge.TeacherId);
                        if(existed != null)
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
            catch (Exception ex) {
                return string.Empty;
            }
           
        }

        public async Task<bool> ChangeMentorAsync(ChangeMentorAPIViewModel mentorInfo)
        {
            try
            {
                //check mentorId 
                Category cate = await _uow.Category.GetFirstOrDefaultAsync(q => q.CategoryId == mentorInfo.CategoryId, "Judges");
                if(cate != null)
                {
                    Judge isDuplicate = cate.Judges.Where(q => q.TeacherId == mentorInfo.MentorId).FirstOrDefault();
                    if (isDuplicate == null)
                    {
                        Teacher teacher = await _uow.Teacher.GetFirstOrDefaultAsync(q => q.Id == mentorInfo.MentorId, "Account");
                        if (teacher != null && teacher.Account.IsActive)
                        {
                            cate.Mentor = mentorInfo.MentorId;
                            _uow.Category.Update(cate);
                            await _uow.SaveAsync();
                            return true;
                        }
                        else return false;
                    }
                    else return false;
                }
                else
                {
                    return false;
                }
            }
            catch (Exception ex)
            {
                return false;
            }

        }
        public async Task<bool> CreateAsync(CreateCategoryAPIViewModel cateInfo,string creator)
        {
            try
            {
                if(!(await IsDuplicate(cateInfo.CategoryName))){
                    Category newCate = new Category()
                    {
                        CategoryName = cateInfo.CategoryName,
                        CategoryId = Guid.NewGuid().ToString(),
                        Creator = creator,
                        EventId = cateInfo.EventID,
                        IsActive = true,
                        Mentor = cateInfo.MentorId

                    };
                    await _uow.Category.AddAsync(newCate);
                    foreach(CreateJudgeAPIViewModel judge in cateInfo.Judges)
                    {
                        Teacher teacher = await _uow.Teacher.GetFirstOrDefaultAsync(q => q.Id == judge.TeacherId,"Account");
                        if (teacher != null && teacher.Account.IsActive)
                        {
                            Judge newJudge = new Judge()
                            {
                                CategoryId = newCate.CategoryId,
                                Id = Guid.NewGuid().ToString(),
                                TeacherId = judge.TeacherId
                            };
                            await _uow.Judge.AddAsync(newJudge);
                        }
                        else return false;
                     

                    }
                    await _uow.SaveAsync();
                    return true;
                }
                else
                {
                    return false;
                }
            }
            catch(Exception ex)
            {
                return false;
            }
        }
       
      
        
    }
}
