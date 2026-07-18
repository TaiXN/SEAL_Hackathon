using APIViewModels.Round;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using Services.RoundService;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace SEAL_Hackathon.Tests
{
    public class RoundServiceTests
    {
        // COLUMN 1 
        [Fact]
        public async Task CreateRoundAsync_NormalConditions_ReturnsTrue()
        {
            var mockUow = new Mock<IUnitOfWork>();
            mockUow.Setup(u => u.CriteriaSet.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<CriteriaSet, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new CriteriaSet { CriteriaSetId = "set-1", IsActive = true });

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((Round)null);

            var emptyQueryableList = new List<Round>().BuildMock();
            mockUow.Setup(u => u.Round.GetAllQueryable()).Returns(emptyQueryableList);

            mockUow.Setup(u => u.Round.GetAllAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<Func<System.Linq.IQueryable<Round>, System.Linq.IOrderedQueryable<Round>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new List<Round>());

            var service = new RoundService(mockUow.Object);
            var request = new CreateRoundAPIViewModel
            {
                RoundName = "Normal Round",
                EventID = "event-1",
                CriteriaSetID = "set-1",
                StartDate = DateTime.Now.AddDays(1),
                EndDate = DateTime.Now.AddDays(3)
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");

            Assert.True(result);
        }
        // COLUMN 2 
        [Fact]
        public async Task CreateRoundAsync_StartDateEqualsEndDate_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var service = new RoundService(mockUow.Object);

            DateTime testDate = DateTime.Now.AddDays(2);
            var request = new CreateRoundAPIViewModel
            {
                StartDate = testDate,
                EndDate = testDate
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");
            Assert.False(result);
        }

        // COLUMN 3
        [Fact]
        public async Task CreateRoundAsync_StartDateAfterEndDate_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var service = new RoundService(mockUow.Object);

            var request = new CreateRoundAPIViewModel
            {
                StartDate = DateTime.Now.AddDays(5),
                EndDate = DateTime.Now.AddDays(2)
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");
            Assert.False(result);
        }

        [Fact]
        public async Task CreateRoundAsync_StartDateInThePast_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var service = new RoundService(mockUow.Object);

            var request = new CreateRoundAPIViewModel
            {
                StartDate = DateTime.Now.AddDays(-2), 
                EndDate = DateTime.Now.AddDays(2)
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");
            Assert.False(result);
        }

        // COLUMN 5  
        [Fact]
        public async Task CreateRoundAsync_StartDateEqualsCurrentTimeBoundary_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var service = new RoundService(mockUow.Object);

            var request = new CreateRoundAPIViewModel
            {
                StartDate = DateTime.Now.AddMilliseconds(-10), 
                EndDate = DateTime.Now.AddDays(2)
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");
            Assert.False(result);
        }
        // COLUMN 6

        [Fact]
        public async Task CreateRoundAsync_SqlExceptionOnSave_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("SQL Server connection interrupted."));

            var service = new RoundService(mockUow.Object);
            var request = new CreateRoundAPIViewModel
            {
                StartDate = DateTime.Now.AddDays(1),
                EndDate = DateTime.Now.AddDays(3)
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");
            Assert.False(result);
        }

        // COLUMN 7 
        [Fact]
        public async Task CreateRoundAsync_DbUpdateExceptionOnSave_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new InvalidOperationException("Database constraint violation."));

            var service = new RoundService(mockUow.Object);
            var request = new CreateRoundAPIViewModel
            {
                StartDate = DateTime.Now.AddDays(1),
                EndDate = DateTime.Now.AddDays(3)
            };

            bool result = await service.CreateRoundAsync(request, "admin-123");
            Assert.False(result);
        }
    }
}