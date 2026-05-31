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

    public virtual DbSet<Admin> Admins { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<Judge> Judges { get; set; }

    public virtual DbSet<Player> Players { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Round> Rounds { get; set; }

    public virtual DbSet<Teacher> Teachers { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<TeamJoined> TeamJoineds { get; set; }

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
            entity.Property(e => e.CategoryName).HasMaxLength(400);
            entity.Property(e => e.Creator)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.Mentor)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.Event).WithMany(p => p.Categories)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Categorie__Event__3D5E1FD2");

            entity.HasOne(d => d.MentorNavigation).WithMany(p => p.Categories)
                .HasForeignKey(d => d.Mentor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Categories_Teacher");
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

        modelBuilder.Entity<Judge>(entity =>
        {
            entity.ToTable("Judge");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.CategoryId)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.TeacherId)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.Category).WithMany(p => p.Judges)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Judge_Categories");

            entity.HasOne(d => d.Teacher).WithMany(p => p.Judges)
                .HasForeignKey(d => d.TeacherId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Judge_Teacher");
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
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.EventId)
                .HasMaxLength(400)
                .IsUnicode(false)
                .HasColumnName("EventID");
            entity.Property(e => e.RoundName).HasMaxLength(255);
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.TopNpromotion).HasColumnName("TopNPromotion");

            entity.HasOne(d => d.Event).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Round__EventID__412EB0B6");
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
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.TeamName).HasMaxLength(255);
        });

        modelBuilder.Entity<TeamJoined>(entity =>
        {
            entity.ToTable("TeamJoined");

            entity.Property(e => e.Id)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.CategoryId)
                .HasMaxLength(400)
                .IsUnicode(false);
            entity.Property(e => e.TeamId)
                .HasMaxLength(400)
                .IsUnicode(false);

            entity.HasOne(d => d.Category).WithMany(p => p.TeamJoineds)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamJoined_Categories");

            entity.HasOne(d => d.Team).WithMany(p => p.TeamJoineds)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TeamJoined_Team");
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
