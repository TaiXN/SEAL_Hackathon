using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;


namespace DataAccess.Repositories.TopicRepository
{
    public interface ITopicRepository : IRepository<Topic>
    {
        void Update(Topic topic);

    }
}
