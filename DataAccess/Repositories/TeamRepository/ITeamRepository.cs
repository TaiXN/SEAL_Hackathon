using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

<<<<<<<< HEAD:DataAccess/Repositories/TeamRepository/ITeamRepository.cs
namespace DataAccess.Repositories.TeamRepository
{   
    public interface ITeamRepository : IRepository<Team>
    {
        void Update(Team team);
========
namespace DataAccess.Repositories.TopicRepository
{
    public interface ITopicRepository : IRepository<Topic>
    {
        void Update(Topic topic);
>>>>>>>> origin/Tai-dev:DataAccess/Repositories/TopicRepository/ITopicRepository.cs
    }
}
