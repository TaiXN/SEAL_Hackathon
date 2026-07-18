using APIViewModels.Criteria;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Moq;
using Services.CriteriaService;
using Services.RoundService;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace SEAL_Hackathon.Tests
{
    public class CriteriaServiceTests
    {


        //c1
        [Fact]
        public async Task UpdateSetAsync_UTCID01_NormalConditions_ReturnsTrue()
        {
            var mockUow = new Mock<IUnitOfWork>();
            mockUow.SetupSequence(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new CriteriaSet { CriteriaSetId = "set-1", IsActive = true })
                .ReturnsAsync((CriteriaSet)null);

            mockUow.Setup(u => u.Criteria.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Criterion, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Criterion { CriteriaId = "crit-1", IsActive = true });

            mockUow.Setup(u => u.Mapping.GetAllAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Mapping, bool>>>(),
                It.IsAny<Func<System.Linq.IQueryable<Mapping>, System.Linq.IOrderedQueryable<Mapping>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new List<Mapping> { new Mapping { CriteriaSetId = "set-1", CriteriaId = "old-crit" } });

            var service = new CriteriaService(mockUow.Object);
            var request = new UpdateSetAPIViewModel
            {
                SetName = "Valid New Name",
                IsDefault = true,
                CriteriaList = new List<CriteriaMappingItemViewModel>
                {
                    new CriteriaMappingItemViewModel { CriteriaId = "crit-1", Score = 10 }
                }
            };

            bool result = await service.UpdateSetAsync("set-1", request);

            Assert.True(result);
            mockUow.Verify(u => u.Mapping.AddRangeAsync(It.IsAny<List<Mapping>>()), Times.Once);
            mockUow.Verify(u => u.SaveAsync(), Times.Once);
        }

        //c2
        [Fact]
        public async Task UpdateSetAsync_UTCID02_TargetSetNotFound_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((CriteriaSet)null);

            var service = new CriteriaService(mockUow.Object);
            var request = new UpdateSetAPIViewModel { SetName = "Any Name" };

            bool result = await service.UpdateSetAsync("missing-id", request);

            Assert.False(result);
        }

        // c3
        [Fact]
        public async Task UpdateSetAsync_UTCID03_TargetSetInActive_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((CriteriaSet)null); // Simulates that no Active set was found

            var service = new CriteriaService(mockUow.Object);
            var request = new UpdateSetAPIViewModel { SetName = "Any Name" };

            bool result = await service.UpdateSetAsync("inactive-id", request);

            Assert.False(result);
        }

        // c4
        [Fact]
        public async Task UpdateSetAsync_UTCID04_CriteriaItemFakeOrInactive_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new CriteriaSet { CriteriaSetId = "set-1", IsActive = true })
                .ReturnsAsync((CriteriaSet)null);

            mockUow.Setup(u => u.Criteria.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Criterion, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((Criterion)null);

            var service = new CriteriaService(mockUow.Object);
            var request = new UpdateSetAPIViewModel
            {
                SetName = "Valid Name",
                CriteriaList = new List<CriteriaMappingItemViewModel>
                {
                    new CriteriaMappingItemViewModel { CriteriaId = "fake-crit-id", Score = 10 }
                }
            };

            bool result = await service.UpdateSetAsync("set-1", request);

            Assert.False(result);
        }

        // c5
        [Fact]
        public async Task UpdateSetAsync_UTCID05_SetNameAlreadyTaken_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new CriteriaSet { CriteriaSetId = "set-1", IsActive = true })
                .ReturnsAsync(new CriteriaSet { CriteriaSetId = "other-set", SetName = "Taken Name" });

            var service = new CriteriaService(mockUow.Object);
            var request = new UpdateSetAPIViewModel { SetName = "Taken Name" };

            bool result = await service.UpdateSetAsync("set-1", request);

            Assert.False(result);
        }

        // c6
        [Fact]
        public async Task UpdateSetAsync_UTCID06_DatabaseException_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new CriteriaSet { CriteriaSetId = "set-1", IsActive = true })
                .ReturnsAsync((CriteriaSet)null);

            mockUow.Setup(u => u.Criteria.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Criterion, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Criterion { CriteriaId = "crit-1", IsActive = true });

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("Database Connection Lost"));

            var service = new CriteriaService(mockUow.Object);
            var request = new UpdateSetAPIViewModel
            {
                SetName = "Valid Name",
                CriteriaList = new List<CriteriaMappingItemViewModel>
                {
                    new CriteriaMappingItemViewModel { CriteriaId = "crit-1", Score = 10 }
                }
            };

            bool result = await service.UpdateSetAsync("set-1", request);

            Assert.False(result);
        }


        // AUTOTRANSITIONROUNDASYNC 

        //c1
        [Fact]
        public async Task AutoTransitionRoundAsync_UTCID01_NormalConditions_ReturnsTrue()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "current-round", EventId = "event-1", RoundIndex = 1, TopNpromotion = 5 })
                .ReturnsAsync(new Round { RoundId = "next-round", EventId = "event-1", RoundIndex = 2, RoundName = "Finals" });

            mockUow.Setup(u => u.Event.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Event { EventId = "event-1", IsActive = true });

            mockUow.Setup(u => u.LeaderBoard.GetAllAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<LeaderBoard, bool>>>(),
                It.IsAny<Func<System.Linq.IQueryable<LeaderBoard>, System.Linq.IOrderedQueryable<LeaderBoard>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new List<LeaderBoard>());

            var service = new RoundService(mockUow.Object);

            var result = await service.AutoTransitionRoundAsync("current-round");

            Assert.True(result.IsSuccess);
            mockUow.Verify(u => u.SaveAsync(), Times.Once);
        }

        // c2
        [Fact]
        public async Task AutoTransitionRoundAsync_UTCID02_EventNotFound_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "current-round", EventId = "fake-event-id" });

            mockUow.Setup(u => u.Event.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((Event)null);

            var service = new RoundService(mockUow.Object);

            var result = await service.AutoTransitionRoundAsync("current-round");

            Assert.False(result.IsSuccess);
        }

        // c3
        [Fact]
        public async Task AutoTransitionRoundAsync_UTCID03_EventInActive_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "current-round", EventId = "event-1" });

            mockUow.Setup(u => u.Event.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((Event)null);

            var service = new RoundService(mockUow.Object);

            var result = await service.AutoTransitionRoundAsync("current-round");

            Assert.False(result.IsSuccess);
        }

        // c4
        [Fact]
        public async Task AutoTransitionRoundAsync_UTCID04_NextRoundNull_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "current-round", EventId = "event-1", RoundIndex = 3 })
                .ReturnsAsync((Round)null);

            mockUow.Setup(u => u.Event.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Event { EventId = "event-1", IsActive = true });

            var service = new RoundService(mockUow.Object);

            var result = await service.AutoTransitionRoundAsync("current-round");

            Assert.False(result.IsSuccess);
        }

        // c5
        [Fact]
        public async Task AutoTransitionRoundAsync_UTCID05_SqlException_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "current-round", EventId = "event-1", RoundIndex = 1, TopNpromotion = 5 })
                .ReturnsAsync(new Round { RoundId = "next-round", EventId = "event-1", RoundIndex = 2 });

            mockUow.Setup(u => u.Event.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Event { EventId = "event-1", IsActive = true });

            mockUow.Setup(u => u.LeaderBoard.GetAllAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<LeaderBoard, bool>>>(),
                It.IsAny<Func<System.Linq.IQueryable<LeaderBoard>, System.Linq.IOrderedQueryable<LeaderBoard>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new List<LeaderBoard>());

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("SqlException: Database server timeout."));

            var service = new RoundService(mockUow.Object);
            var result = await service.AutoTransitionRoundAsync("current-round");

            Assert.False(result.IsSuccess);
        }

        // c6
        [Fact]
        public async Task AutoTransitionRoundAsync_UTCID06_DbUpdateException_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.SetupSequence(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "current-round", EventId = "event-1", RoundIndex = 1, TopNpromotion = 5 })
                .ReturnsAsync(new Round { RoundId = "next-round", EventId = "event-1", RoundIndex = 2 });

            mockUow.Setup(u => u.Event.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Event { EventId = "event-1", IsActive = true });

            mockUow.Setup(u => u.LeaderBoard.GetAllAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<LeaderBoard, bool>>>(),
                It.IsAny<Func<System.Linq.IQueryable<LeaderBoard>, System.Linq.IOrderedQueryable<LeaderBoard>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new List<LeaderBoard>());

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Microsoft.EntityFrameworkCore.DbUpdateException("Entity Framework Update Error"));

            var service = new RoundService(mockUow.Object);
            var result = await service.AutoTransitionRoundAsync("current-round");

            Assert.False(result.IsSuccess);
        }
    }
}