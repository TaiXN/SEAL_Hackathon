using APIViewModels.Round;
using DataAccess.Entities;
using DataAccess.Repositories.TeacherListRepository;
using DataAccess.Repositories.UnitOfWork;
using Moq;
using Services.MentorService;
using Services.RoundService;
using System;
using System.Threading.Tasks;
using Xunit;

namespace SEAL_Hackathon.Tests
{
    public class MentorServiceTests
    {
        // COLUMN 1 
        [Fact]
        public async Task AddMentor_NormalConditions_ReturnsTrue()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var mockTeacherRepo = new Mock<ITeacherListRepository>();
            mockUow.Setup(u => u.TeacherList).Returns(mockTeacherRepo.Object);

            var service = new MentorService(mockUow.Object);

            bool result = await service.AddMentor("mentor-01", "track-01");

            Assert.True(result);
            mockTeacherRepo.Verify(r => r.AddAsync(It.IsAny<TeacherList>()), Times.Once);
            mockUow.Verify(u => u.SaveAsync(), Times.Once);
        }

        // COLUMN 2 
        [Fact]
        public async Task AddMentor_UserHasHistoryButNotActiveMentor_ReturnsTrue()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var mockTeacherRepo = new Mock<ITeacherListRepository>();
            mockUow.Setup(u => u.TeacherList).Returns(mockTeacherRepo.Object);

            var service = new MentorService(mockUow.Object);

            bool result = await service.AddMentor("mentor-history-id", "track-01");

            Assert.True(result);
        }

        // COLUMN 3 
        [Fact]
        public async Task AddMentor_AlreadyAMentor_ThrowsDatabaseException_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var mockTeacherRepo = new Mock<ITeacherListRepository>();
            mockUow.Setup(u => u.TeacherList).Returns(mockTeacherRepo.Object);

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("PK Violation: Duplicate Mentor assignment."));

            var service = new MentorService(mockUow.Object);

            bool result = await service.AddMentor("existing-mentor-id", "track-01");

            Assert.False(result);
        }

        // COLUMN 4 
        [Fact]
        public async Task AddMentor_MentorIdIsEmpty_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var mockTeacherRepo = new Mock<ITeacherListRepository>();
            mockUow.Setup(u => u.TeacherList).Returns(mockTeacherRepo.Object);

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("Cannot insert NULL into TeacherID"));

            var service = new MentorService(mockUow.Object);

            bool result = await service.AddMentor("", "track-01");

            Assert.False(result);
        }

        // COLUMN 5
        [Fact]
        public async Task AddMentor_TrackIdIsEmpty_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var mockTeacherRepo = new Mock<ITeacherListRepository>();
            mockUow.Setup(u => u.TeacherList).Returns(mockTeacherRepo.Object);

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("Cannot insert NULL into TrackID"));

            var service = new MentorService(mockUow.Object);

            bool result = await service.AddMentor("mentor-01", "");

            Assert.False(result);
        }

        [Fact]
        public async Task AddMentor_ForeignKeyConstraintError_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();
            var mockTeacherRepo = new Mock<ITeacherListRepository>();
            mockUow.Setup(u => u.TeacherList).Returns(mockTeacherRepo.Object);

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("The INSERT statement conflicted with the FOREIGN KEY constraint."));

            var service = new MentorService(mockUow.Object);

            bool result = await service.AddMentor("valid-mentor-id", "fake-non-existent-track-id");

            Assert.False(result);
        }

        // UPDATEROUNDASYNC TESTS

        //c1
        [Fact]
        public async Task UpdateRoundAsync_UTCID01_NormalConditions_ReturnsTrue()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "round-1" });

            var service = new RoundService(mockUow.Object);
            var request = new UpdateRoundAPIViewModel
            {
                RoundID = "round-1",
                StartDate = DateTime.Now.AddDays(1), 
                EndDate = DateTime.Now.AddDays(5)    
            };

            bool result = await service.UpdateRoundAsync(request);

            Assert.True(result);
            mockUow.Verify(u => u.Round.Update(It.IsAny<Round>()), Times.Once);
            mockUow.Verify(u => u.SaveAsync(), Times.Once);
        }

        // c2
        [Fact]
        public async Task UpdateRoundAsync_UTCID02_RoundNotFound_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync((Round)null);

            var service = new RoundService(mockUow.Object);
            var request = new UpdateRoundAPIViewModel { RoundID = "missing-id" };
            bool result = await service.UpdateRoundAsync(request);

            Assert.False(result);
        }

        //c3    
        [Fact]
        public async Task UpdateRoundAsync_UTCID03_StartDateAfterEndDate_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "round-1" });

            var service = new RoundService(mockUow.Object);
            var request = new UpdateRoundAPIViewModel
            {
                RoundID = "round-1",
                StartDate = DateTime.Now.AddDays(5), 
                EndDate = DateTime.Now.AddDays(2)
            };

            bool result = await service.UpdateRoundAsync(request);
            Assert.False(result);
        }

        // c4
        [Fact]
        public async Task UpdateRoundAsync_UTCID04_StartDateInPast_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "round-1" });

            var service = new RoundService(mockUow.Object);
            var request = new UpdateRoundAPIViewModel
            {
                RoundID = "round-1",
                StartDate = DateTime.Now.AddDays(-2),
                EndDate = DateTime.Now.AddDays(2)     
            };

            bool result = await service.UpdateRoundAsync(request);

            Assert.False(result);
        }

        // c5
        [Fact]
        public async Task UpdateRoundAsync_UTCID05_DatabaseException_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "round-1" });

            mockUow.Setup(u => u.SaveAsync()).ThrowsAsync(new Exception("Simulated DB Crash"));

            var service = new RoundService(mockUow.Object);
            var request = new UpdateRoundAPIViewModel
            {
                RoundID = "round-1",
                StartDate = DateTime.Now.AddDays(1),
                EndDate = DateTime.Now.AddDays(5)
            };

            bool result = await service.UpdateRoundAsync(request);
            Assert.False(result);
        }

        // c6
        [Fact]
        public async Task UpdateRoundAsync_UTCID06_StartDateEqualsEndDate_ReturnsFalse()
        {
            var mockUow = new Mock<IUnitOfWork>();

            mockUow.Setup(u => u.Round.GetFirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<Round, bool>>>(),
                It.IsAny<string>()))
                .ReturnsAsync(new Round { RoundId = "round-1" });

            var service = new RoundService(mockUow.Object);
            DateTime boundaryDate = DateTime.Now.AddDays(3);
            var request = new UpdateRoundAPIViewModel
            {
                RoundID = "round-1",
                StartDate = boundaryDate,
                EndDate = boundaryDate 
            };

            bool result = await service.UpdateRoundAsync(request);

            Assert.False(result);
        }
    }
}