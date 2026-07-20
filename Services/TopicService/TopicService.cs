using APIViewModels.Criteria;
using APIViewModels.Topic;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.TopicService
{
    public class TopicService : ITopicService
    {
        private readonly IUnitOfWork _uow;
        public TopicService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateTopicAsync(CreateTopicAPIViewModel info)
        {
            try
            {
                Topic topic = await _uow.Topic.GetFirstOrDefaultAsync(e => e.TopicDetail.ToLower() == info.TopicDetail.ToLower());

                if (topic != null)
                {
                    return false;
                }

                Topic newTopic = new Topic()
                {
                    TopicId = Guid.NewGuid().ToString(),
                    TopicDetail = info.TopicDetail,
                    TrackId = info.TrackID,
                    IsActive = true
                };
                await _uow.Topic.AddAsync(newTopic);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<List<TopicAPIViewModel>> GetAllTopicsAsync()
        {
            try
            {
                List<Topic> result = await _uow.Topic.GetAllAsync();

                return result.Select(t => new TopicAPIViewModel
                {
                    TopicId = t.TopicId,
                    TrackId = t.TrackId,
                    TopicDetail = t.TopicDetail,
                    IsActive = t.IsActive
                }).ToList();
            }
            catch
            {
                return new List<TopicAPIViewModel>();
            }
        }

        public async Task<TopicAPIViewModel> GetTopicByIdAsync(string topicID)
        {
            try
            {
                Topic t = await _uow.Topic.GetFirstOrDefaultAsync(e => e.TopicId == topicID && e.IsActive);
                if (t == null) return null;

                return new TopicAPIViewModel
                {
                    TopicId = t.TopicId,
                    TrackId = t.TrackId,
                    TopicDetail = t.TopicDetail,
                    IsActive = t.IsActive
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdatTopicAsync(string id, UpdateTopicAPIViewModel info)
        {
            try
            {
                Topic topicDb = await _uow.Topic.GetFirstOrDefaultAsync(e => e.TopicId == id && e.IsActive);
                if (topicDb == null) return false;

                Topic duplicateCheck = await _uow.Topic.GetFirstOrDefaultAsync(e => e.TopicDetail.ToLower() == info.TopicDetail.ToLower() && e.TopicId != id && e.IsActive);

                if (duplicateCheck != null)
                {
                    return false;
                }

                topicDb.TopicDetail = info.TopicDetail;
                topicDb.TrackId = info.TrackID;

                _uow.Topic.Update(topicDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteTopicAsync(string topicID)
        {
            try
            {
                Topic result = await _uow.Topic.GetFirstOrDefaultAsync(e => e.TopicId.Equals(topicID));
                if (result == null) return false;

                result.IsActive = false;
                _uow.Topic.Update(result);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}
