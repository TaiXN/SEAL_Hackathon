import {
  Link,
  ShieldAlert,
  Lock,
  UserPlus,
  User,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
export function Team() {
  const [inviteCode, setInviteCode] = useState("HACK-2026-X9K2P");
  const [isCopied, setIsCopied] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Nguyen Quoc Lap",
      role: "Team Leader",
      initials: "NL",
      isCurrentUser: true,
    },
    {
      id: 2,
      name: "Nguyen Huynh Hoang Uyen",
      role: "Frontend Role",
      initials: "NU",
      isCurrentUser: false,
    },
    {
      id: 3,
      name: "Nguyen Quang Tri",
      role: "Frontend Role",
      initials: "NT",
      isCurrentUser: false,
    },
    {
      id: 4,
      name: "Nguyen Thien Tai",
      role: "Backend Role",
      initials: "NT",
      isCurrentUser: false,
    },
    {
      id: 5,
      name: "Le Hoang Anh",
      role: "Backend Role",
      initials: "LA",
      isCurrentUser: false,
    },
  ]);

  const maxMembers = 5;
  const emptySlots = maxMembers - teamMembers.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://hackathon.com/invite/${inviteCode}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Remove Team Member",
      description: `Are you sure you want to remove ${memberName} from the team? They will lose access to team resources and need a new invite to rejoin.`,
      confirmText: "Remove Member",
      onConfirm: () => {
        setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      },
    });
  };

  const handleLockTeam = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Lock Team Roster",
      description:
        "Are you absolutely sure you want to lock the team? Once locked, you will not be able to add or remove members. This action cannot be undone.",
      confirmText: "Lock Team",
      onConfirm: () => {
        // Logic to lock team would go here
        console.log("Team locked");
      },
    });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          My Team
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your hackathon squad. You can have up to 5 members.
        </p>
      </header>

      <div className="space-y-8">
        {/* Invite Section */}
        <section className="bg-card border border-border rounded-radius-lg p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
          <div className="flex-1 w-full space-y-2">
            <label
              htmlFor="invite-link"
              className="text-sm font-medium text-foreground"
            >
              Invite teammates
            </label>
            <div className="flex w-full">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Link className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  id="invite-link"
                  className="bg-input-background border-none text-foreground text-sm rounded-l-radius-md block w-full pl-10 p-3 outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                  value={`https://hackathon.com/invite/${inviteCode}`}
                  readOnly
                />
              </div>
              <button
                onClick={handleCopy}
                className="bg-primary text-primary-foreground px-4 py-3 text-sm font-medium rounded-r-radius-md hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                {isCopied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {isCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </section>

        {/* Team Members List */}
        <section className="bg-card border border-border rounded-radius-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <h2 className="font-bold text-lg">Team Roster</h2>
            <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
              {teamMembers.length} / {maxMembers} Members
            </span>
          </div>

          <div className="divide-y divide-border">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-lg">
                        {member.name}
                      </span>
                      {member.isCurrentUser && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground border border-border">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {member.role}
                    </span>
                  </div>
                </div>
                {member.isCurrentUser ? (
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors px-3 py-2 rounded-radius-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: emptySlots }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="p-4 sm:p-6 flex items-center justify-between bg-muted/5 border-dashed border-t border-border/50"
              >
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground italic">
                      Empty Slot
                    </span>
                    <p className="text-sm text-muted-foreground/70">
                      Waiting for member to join...
                    </p>
                  </div>
                </div>
                <button className="text-sm font-medium text-primary hover:underline flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Lock Team Section */}
        <section className="mt-12 p-6 bg-destructive/5 border border-destructive/20 rounded-radius-lg">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Lock Team Submission
                </h3>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  Once you lock your team, you will{" "}
                  <strong className="text-foreground">
                    not be able to add or remove members
                  </strong>
                  . Ensure your roster is completely finalized before
                  proceeding. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={handleLockTeam}
                className="bg-destructive text-destructive-foreground px-6 py-3 rounded-radius-md font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Lock className="w-4 h-4" />
                Lock Team Roster
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmText={confirmModalConfig.confirmText}
      />
    </div>
  );
}
