using Xunit;
using Moq;
using Services.MentorService;
using DataAccess.Repositories.UnitOfWork;
using DataAccess.Repositories.TeacherListRepository;
using DataAccess.Entities;
using System;
using System.Threading.Tasks;

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
    }
}