using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Entities;

public partial class SealHackathonContext : DbContext
{
    public SealHackathonContext()
    {
    }

    public SealHackathonContext(DbContextOptions<SealHackathonContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<Admin> Admins { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Criterion> Criteria { get; set; }

    public virtual DbSet<Evaluation> Evaluations { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<JudgeAssignment> JudgeAssignments { get; set; }

    public virtual DbSet<Mapping> Mappings { get; set; }

    public virtual DbSet<MentorAssignment> MentorAssignments { get; set; }

    public virtual DbSet<Player> Players { get; set; }

    public virtual DbSet<Prize> Prizes { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Round> Rounds { get; set; }

    public virtual DbSet<Submission> Submissions { get; set; }

    public virtual DbSet<Teacher> Teachers { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<University> Universities { get; set; }

    public virtual DbSet<UserTeam> UserTeams { get; set; }

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

        modelBuilder.Entity<Admin>(entity =>
        {
            entity.HasKey(e => e.AdminId).HasName("PK__Admin__719FE4E8F63E0F46");

            entity.ToTable("Admin");

            entity.Property(e => e.AdminId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("AdminID");
            entity.Property(e => e.AccountId)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.Account).WithMany(p => p.Admins)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Admin_Account");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__19093A2B3A94678D");

            entity.Property(e => e.CategoryId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CategoryID");
            entity.Property(e => e.AdminId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("AdminID");
            entity.Property(e => e.CategoryName).HasMaxLength(400);
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");

            entity.HasOne(d => d.Admin).WithMany(p => p.Categories)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Categorie__Admin__3E52440B");

            entity.HasOne(d => d.Event).WithMany(p => p.Categories)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Categorie__Event__3D5E1FD2");
        });

        modelBuilder.Entity<Criterion>(entity =>
        {
            entity.HasKey(e => e.CriteriaId).HasName("PK__Criteria__FE6ADB2DF4B4AF9B");

            entity.Property(e => e.CriteriaId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaID");
            entity.Property(e => e.CriteriaName).HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.RoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoundID");

            entity.HasOne(d => d.Round).WithMany(p => p.Criteria)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Criteria__RoundI__44FF419A");
        });

        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.HasKey(e => e.EvaluationId).HasName("PK__Evaluati__36AE68D340FC00B0");

            entity.ToTable("Evaluation");

            entity.Property(e => e.EvaluationId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EvaluationID");
            entity.Property(e => e.CriteriaId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CriteriaID");
            entity.Property(e => e.Feedback).HasMaxLength(255);
            entity.Property(e => e.JudgeAssignmentId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("JudgeAssignmentID");
            entity.Property(e => e.SubmissionId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("SubmissionID");

            entity.HasOne(d => d.Criteria).WithMany(p => p.Evaluations)
                .HasForeignKey(d => d.CriteriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Evaluatio__Crite__619B8048");

            entity.HasOne(d => d.JudgeAssignment).WithMany(p => p.Evaluations)
                .HasForeignKey(d => d.JudgeAssignmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Evaluatio__Judge__5FB337D6");

            entity.HasOne(d => d.Submission).WithMany(p => p.Evaluations)
                .HasForeignKey(d => d.SubmissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Evaluatio__Submi__60A75C0F");
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.EventId).HasName("PK__Event__7944C8703E8C8C75");

            entity.ToTable("Event");

            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.AdminId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("AdminID");
            entity.Property(e => e.DisqualifyReason).HasMaxLength(255);
            entity.Property(e => e.EventName).HasMaxLength(400);
            entity.Property(e => e.Season).HasMaxLength(50);

            entity.HasOne(d => d.Admin).WithMany(p => p.Events)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Event__AdminID__37A5467C");
        });

        modelBuilder.Entity<JudgeAssignment>(entity =>
        {
            entity.HasKey(e => e.JudgeAssignmentId).HasName("PK__Judge_As__071F55C2B6D69AE6");

            entity.ToTable("Judge_Assignment");

            entity.Property(e => e.JudgeAssignmentId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("JudgeAssignmentID");
            entity.Property(e => e.JudgeId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("JudgeID");
            entity.Property(e => e.RoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoundID");
            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");

            entity.HasOne(d => d.Judge).WithMany(p => p.JudgeAssignments)
                .HasForeignKey(d => d.JudgeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Judge_Ass__Judge__5AEE82B9");

            entity.HasOne(d => d.Round).WithMany(p => p.JudgeAssignments)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Judge_Ass__Round__5BE2A6F2");

            entity.HasOne(d => d.Team).WithMany(p => p.JudgeAssignments)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Judge_Ass__TeamI__5CD6CB2B");
        });

        modelBuilder.Entity<Mapping>(entity =>
        {
            entity.HasKey(e => e.MappingId).HasName("PK__Mapping__8B5781BD0F98E1DF");

            entity.ToTable("Mapping");

            entity.Property(e => e.MappingId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("MappingID");
            entity.Property(e => e.CategoryId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CategoryID");
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.MentorId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("MentorID");

            entity.HasOne(d => d.Category).WithMany(p => p.Mappings)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Mapping__Categor__534D60F1");

            entity.HasOne(d => d.Event).WithMany(p => p.Mappings)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Mapping__EventID__52593CB8");

            entity.HasOne(d => d.Mentor).WithMany(p => p.Mappings)
                .HasForeignKey(d => d.MentorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Mapping__MentorI__5441852A");
        });

        modelBuilder.Entity<MentorAssignment>(entity =>
        {
            entity.HasKey(e => e.MentorAssignmentId).HasName("PK__Mentor_A__26E98C942E117281");

            entity.ToTable("Mentor_Assignment");

            entity.Property(e => e.MentorAssignmentId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("MentorAssignmentID");
            entity.Property(e => e.CategoryId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CategoryID");
            entity.Property(e => e.MentorId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("MentorID");

            entity.HasOne(d => d.Category).WithMany(p => p.MentorAssignments)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Mentor_As__Categ__5812160E");

            entity.HasOne(d => d.Mentor).WithMany(p => p.MentorAssignments)
                .HasForeignKey(d => d.MentorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Mentor_As__Mento__571DF1D5");
        });

        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasKey(e => e.PlayerId).HasName("PK__Player__4A4E74A88A71AEFD");

            entity.ToTable("Player");

            entity.Property(e => e.PlayerId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("PlayerID");
            entity.Property(e => e.AccountId)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.StudentId)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("StudentID");
            entity.Property(e => e.UniversityId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("UniversityID");

            entity.HasOne(d => d.Account).WithMany(p => p.Players)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Player_Account");

            entity.HasOne(d => d.University).WithMany(p => p.Players)
                .HasForeignKey(d => d.UniversityId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Player__Universi__31EC6D26");
        });

        modelBuilder.Entity<Prize>(entity =>
        {
            entity.HasKey(e => e.PrizeId).HasName("PK__Prize__5C36F4BB41745946");

            entity.ToTable("Prize");

            entity.Property(e => e.PrizeId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("PrizeID");
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.PrizeName).HasMaxLength(255);

            entity.HasOne(d => d.Event).WithMany(p => p.Prizes)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Prize__EventID__3A81B327");
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
            entity.HasKey(e => e.RoleId).HasName("PK__Role__8AFACE3AB2D7BD8F");

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
            entity.Property(e => e.AdminId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("AdminID");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.RoundName).HasMaxLength(255);
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.TopNpromotion).HasColumnName("TopNPromotion");

            entity.HasOne(d => d.Admin).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Round__AdminID__4222D4EF");

            entity.HasOne(d => d.Event).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Round__EventID__412EB0B6");
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.HasKey(e => e.SubmissionId).HasName("PK__Submissi__449EE1059E0A4B2E");

            entity.ToTable("Submission");

            entity.Property(e => e.SubmissionId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("SubmissionID");
            entity.Property(e => e.DemoUrl)
                .HasMaxLength(255)
                .HasColumnName("DemoURL");
            entity.Property(e => e.ProjectName).HasMaxLength(400);
            entity.Property(e => e.ProjectUrl)
                .HasMaxLength(255)
                .HasColumnName("ProjectURL");
            entity.Property(e => e.RoundId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("RoundID");
            entity.Property(e => e.SlideUrl)
                .HasMaxLength(255)
                .HasColumnName("SlideURL");
            entity.Property(e => e.SubmitTime).HasColumnType("datetime");
            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");

            entity.HasOne(d => d.Round).WithMany(p => p.Submissions)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Submissio__Round__4F7CD00D");

            entity.HasOne(d => d.Team).WithMany(p => p.Submissions)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Submissio__TeamI__4E88ABD4");
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__JudgeOrM__3214EC071DF830B8");

            entity.ToTable("Teacher");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.AccountId)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.Account).WithMany(p => p.Teachers)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Teacher_Account");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.TeamId).HasName("PK__Team__123AE7B90B3889B5");

            entity.ToTable("Team");

            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");
            entity.Property(e => e.CategoryId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("CategoryID");
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.TeamName).HasMaxLength(255);

            entity.HasOne(d => d.Category).WithMany(p => p.Teams)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Team__CategoryID__47DBAE45");
        });

        modelBuilder.Entity<University>(entity =>
        {
            entity.HasKey(e => e.UniversityId).HasName("PK__Universi__9F19E19CAC4556A2");

            entity.ToTable("University");

            entity.Property(e => e.UniversityId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("UniversityID");
            entity.Property(e => e.UniversityName).HasMaxLength(400);
        });

        modelBuilder.Entity<UserTeam>(entity =>
        {
            entity.HasKey(e => new { e.TeamId, e.PlayerId }).HasName("PK__User_Tea__869E00F37F9CDC74");

            entity.ToTable("User_Team");

            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("TeamID");
            entity.Property(e => e.PlayerId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("PlayerID");

            entity.HasOne(d => d.Player).WithMany(p => p.UserTeams)
                .HasForeignKey(d => d.PlayerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__User_Team__Playe__4BAC3F29");

            entity.HasOne(d => d.Team).WithMany(p => p.UserTeams)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__User_Team__TeamI__4AB81AF0");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
