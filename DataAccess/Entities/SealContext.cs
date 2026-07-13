using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Entities;

public partial class SealContext : DbContext
{
    public SealContext()
    {
    }

    public SealContext(DbContextOptions<SealContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<CriteriaSet> CriteriaSets { get; set; }

    public virtual DbSet<Criterion> Criteria { get; set; }

    public virtual DbSet<Evaluation> Evaluations { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<LeaderBoard> LeaderBoards { get; set; }

    public virtual DbSet<LeaderBoardDetail> LeaderBoardDetails { get; set; }

    public virtual DbSet<Mapping> Mappings { get; set; }

    public virtual DbSet<Prize> Prizes { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Round> Rounds { get; set; }

    public virtual DbSet<Student> Students { get; set; }

    public virtual DbSet<Submission> Submissions { get; set; }

    public virtual DbSet<Teacher> Teachers { get; set; }

    public virtual DbSet<TeacherList> TeacherLists { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<TeamInRound> TeamInRounds { get; set; }

    public virtual DbSet<TeamMember> TeamMembers { get; set; }

    public virtual DbSet<Topic> Topics { get; set; }

    public virtual DbSet<Track> Tracks { get; set; }

    public virtual DbSet<University> Universities { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=14.225.205.93;Database=SEAL;User Id=SEAL;Password=SEAL123!@#...;Encrypt=False;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(e => e.AccountId).HasName("PK__Account__349DA586049BE7C0");

            entity.ToTable("Account");

            entity.Property(e => e.AccountId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("AccountID");
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.FullName).HasMaxLength(255);
            entity.Property(e => e.Password)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.RoleId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoleID");

            entity.HasOne(d => d.Role).WithMany(p => p.Accounts)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Account__RoleID__286302EC");
        });

        modelBuilder.Entity<CriteriaSet>(entity =>
        {
            entity.HasKey(e => e.CriteriaSetId).HasName("PK_CriteriaTemplate");

            entity.ToTable("CriteriaSet");

            entity.Property(e => e.CriteriaSetId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaSetID");
            entity.Property(e => e.SetName).HasMaxLength(100);
        });

        modelBuilder.Entity<Criterion>(entity =>
        {
            entity.HasKey(e => e.CriteriaId);

            entity.Property(e => e.CriteriaId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaID");
            entity.Property(e => e.CriteriaName).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(100);
        });

        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.ToTable("Evaluation");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.Reason).HasMaxLength(400);
            entity.Property(e => e.SubmissionId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("SubmissionID");
            entity.Property(e => e.TeacherId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeacherID");

            entity.HasOne(d => d.Submission).WithMany(p => p.Evaluations)
                .HasForeignKey(d => d.SubmissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Evaluation_Submission");
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.EventId).HasName("PK__Event__7944C8703E8C8C75");

            entity.ToTable("Event");

            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.Creator)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.EventName).HasMaxLength(400);
            entity.Property(e => e.Season).HasMaxLength(50);

            entity.HasOne(d => d.CreatorNavigation).WithMany(p => p.Events)
                .HasForeignKey(d => d.Creator)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Event_Account");
        });

        modelBuilder.Entity<LeaderBoard>(entity =>
        {
            entity.ToTable("LeaderBoard");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.RoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoundID");
            entity.Property(e => e.TrackId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TrackID");

            entity.HasOne(d => d.Round).WithMany(p => p.LeaderBoards)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaderBoard_Round");

            entity.HasOne(d => d.Track).WithMany(p => p.LeaderBoards)
                .HasForeignKey(d => d.TrackId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaderBoard_Tracks");
        });

        modelBuilder.Entity<LeaderBoardDetail>(entity =>
        {
            entity.ToTable("LeaderBoardDetail");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.LeaderBoardId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("LeaderBoardID");
            entity.Property(e => e.TeamInRoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamInRoundID");

            entity.HasOne(d => d.LeaderBoard).WithMany(p => p.LeaderBoardDetails)
                .HasForeignKey(d => d.LeaderBoardId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaderBoardDetail_LeaderBoard");

            entity.HasOne(d => d.TeamInRound).WithMany(p => p.LeaderBoardDetails)
                .HasForeignKey(d => d.TeamInRoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LeaderBoardDetail_TeamInRound");
        });

        modelBuilder.Entity<Mapping>(entity =>
        {
            entity.HasKey(e => new { e.CriteriaSetId, e.CriteriaId });

            entity.ToTable("Mapping");

            entity.Property(e => e.CriteriaSetId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaSetID");
            entity.Property(e => e.CriteriaId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaID");

            entity.HasOne(d => d.Criteria).WithMany(p => p.Mappings)
                .HasForeignKey(d => d.CriteriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Mapping_Criteria");

            entity.HasOne(d => d.CriteriaSet).WithMany(p => p.Mappings)
                .HasForeignKey(d => d.CriteriaSetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Mapping_CriteriaTemplate");
        });

        modelBuilder.Entity<Prize>(entity =>
        {
            entity.ToTable("Prize");

            entity.Property(e => e.PrizeId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("PrizeID");
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.PrizeName).HasMaxLength(255);
            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");

            entity.HasOne(d => d.Event).WithMany(p => p.Prizes)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Prize_Event");

            entity.HasOne(d => d.Team).WithMany(p => p.Prizes)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Prize_Team");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.TokenId).HasName("PK__RefreshT__658FEE8A41AE5009");

            entity.ToTable("RefreshToken");

            entity.Property(e => e.TokenId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TokenID");
            entity.Property(e => e.AccountId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("AccountID");
            entity.Property(e => e.ExpiredDate).HasColumnType("datetime");
            entity.Property(e => e.TokenValue).HasMaxLength(255);

            entity.HasOne(d => d.Account).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RefreshTo__Accou__2B3F6F97");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Role__8AFACE3A56D2DEB6");

            entity.ToTable("Role");

            entity.Property(e => e.RoleId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoleID");
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<Round>(entity =>
        {
            entity.HasKey(e => e.RoundId).HasName("PK__Round__94D84E1A6A350444");

            entity.ToTable("Round");

            entity.Property(e => e.RoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoundID");
            entity.Property(e => e.Creator)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.CriteriaSetId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaSetID");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.RoundName).HasMaxLength(255);
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.TopNpromotion).HasColumnName("TopNPromotion");

            entity.HasOne(d => d.CriteriaSet).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.CriteriaSetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Round_CriteriaSet");

            entity.HasOne(d => d.Event).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Round__EventID__412EB0B6");
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("Student");

            entity.Property(e => e.StudentId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("StudentID");
            entity.Property(e => e.UniversityId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("UniversityID");

            entity.HasOne(d => d.StudentNavigation).WithOne(p => p.Student)
                .HasForeignKey<Student>(d => d.StudentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Student_Account");

            entity.HasOne(d => d.University).WithMany(p => p.Students)
                .HasForeignKey(d => d.UniversityId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Student_University");
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.ToTable("Submission");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.TeamInRoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamInRoundID");
            entity.Property(e => e.Urldemo)
                .HasMaxLength(400)
                .HasColumnName("URLDemo");
            entity.Property(e => e.Urlgithub)
                .HasMaxLength(400)
                .HasColumnName("URLGithub");
            entity.Property(e => e.Urlslide)
                .HasMaxLength(400)
                .HasColumnName("URLSlide");

            entity.HasOne(d => d.TeamInRound).WithMany(p => p.Submissions)
                .HasForeignKey(d => d.TeamInRoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Submission_TeamInRound");
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.ToTable("Teacher");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.IdNavigation).WithOne(p => p.Teacher)
                .HasForeignKey<Teacher>(d => d.Id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Teacher_Account");
        });

        modelBuilder.Entity<TeacherList>(entity =>
        {
            entity.HasKey(e => new { e.TeacherId, e.TrackId });

            entity.ToTable("TeacherList");

            entity.Property(e => e.TeacherId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeacherID");
            entity.Property(e => e.TrackId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TrackID");

            entity.HasOne(d => d.Teacher).WithMany(p => p.TeacherLists)
                .HasForeignKey(d => d.TeacherId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeacherList_Teacher");

            entity.HasOne(d => d.Track).WithMany(p => p.TeacherLists)
                .HasForeignKey(d => d.TrackId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeacherList_Tracks");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.TeamId).HasName("PK__Team__123AE7B90B3889B5");

            entity.ToTable("Team");

            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");
            entity.Property(e => e.TeamName).HasMaxLength(255);
        });

        modelBuilder.Entity<TeamInRound>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_TeamJoined");

            entity.ToTable("TeamInRound");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.RoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoundID");
            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.TopicId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TopicID");
            entity.Property(e => e.TrackId)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.Round).WithMany(p => p.TeamInRounds)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamInRound_Round");

            entity.HasOne(d => d.Team).WithMany(p => p.TeamInRounds)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamInRound_Team");

            entity.HasOne(d => d.Topic).WithMany(p => p.TeamInRounds)
                .HasForeignKey(d => d.TopicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamInRound_Topic");

            entity.HasOne(d => d.Track).WithMany(p => p.TeamInRounds)
                .HasForeignKey(d => d.TrackId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamInRound_Tracks");
        });

        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.HasKey(e => new { e.TeamId, e.StudentId }).HasName("PK__User_Tea__869E00F37F9CDC74");

            entity.ToTable("TeamMember");

            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");
            entity.Property(e => e.StudentId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("StudentID");

            entity.HasOne(d => d.Student).WithMany(p => p.TeamMembers)
                .HasForeignKey(d => d.StudentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamMember_Student");

            entity.HasOne(d => d.Team).WithMany(p => p.TeamMembers)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__User_Team__TeamI__4AB81AF0");
        });

        modelBuilder.Entity<Topic>(entity =>
        {
            entity.ToTable("Topic");

            entity.Property(e => e.TopicId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TopicID");
            entity.Property(e => e.TrackId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TrackID");

            entity.HasOne(d => d.Track).WithMany(p => p.Topics)
                .HasForeignKey(d => d.TrackId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Topic_Tracks");
        });

        modelBuilder.Entity<Track>(entity =>
        {
            entity.HasKey(e => e.TrackId).HasName("PK__Categori__19093A2B3A94678D");

            entity.Property(e => e.TrackId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TrackID");
            entity.Property(e => e.Creator)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.TrackName).HasMaxLength(400);

            entity.HasOne(d => d.Event).WithMany(p => p.Tracks)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Categorie__Event__3D5E1FD2");
        });

        modelBuilder.Entity<University>(entity =>
        {
            entity.HasKey(e => e.UniversityId).HasName("PK__Universi__9F19E19CADDAE3B1");

            entity.ToTable("University");

            entity.Property(e => e.UniversityId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("UniversityID");
            entity.Property(e => e.UniversityName).HasMaxLength(400);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
