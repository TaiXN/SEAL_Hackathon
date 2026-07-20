using APIViewModels.Topic;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.TopicService
{
    public interface ITopicService
    {
        Task<bool> CreateTopicAsync(CreateTopicAPIViewModel info);
        Task<List<TopicAPIViewModel>> GetAllTopicsAsync();
        Task<TopicAPIViewModel> GetTopicByIdAsync(string topicID);
        Task<bool> UpdatTopicAsync(string id, UpdateTopicAPIViewModel info);
        Task<bool> DeleteTopicAsync(string topicID);

    }
}
