import { Link, UserPlus, User, CheckCircle2, Copy, Edit2 } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import { teamApi } from "../../lib/api/teamApi";
import { useAuthStore } from "../../stores/auth.store";
import {
  normalizeList,
  unwrapData,
  getCurrentTeamFromHistory,
  getTeamId,
  isLeaderTeam,
} from "../../lib/utils/teamHelpers";
import {
  extractTeamIdFromJoinInput,
  getCurrentUserFromToken,
  getInitials,
  getMemberPlayerId,
  getMembers,
  getTeamDisplayName,
  getTeamEventName,
  getTeamTopicName,
  getTeamTrackName,
  isLeaderMember,
  isSelfMember,
  resolveMemberName,
  resolveMemberRole,
} from "../../lib/utils/playerTeamHelpers";

export function Team() {
  const [team, setTeam] = useState<any>(null);
  const [teamHistory, setTeamHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [joinInput, setJoinInput] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);

  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserInfo = getCurrentUserFromToken(accessToken);

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

  const fetchMyTeam = async () => {
    try {
      setIsLoading(true);

      const historyResponse = await teamApi.getMyTeamsHistory();
      const teamHistory = normalizeList(historyResponse);
      setTeamHistory(teamHistory);
      const currentTeam = getCurrentTeamFromHistory(teamHistory);

      if (!currentTeam) {
        setTeam(null);
        return;
      }

      const currentTeamId = getTeamId(currentTeam);

      if (!currentTeamId) {
        setTeam(currentTeam);
        return;
      }

      try {
        const membersResponse = await teamApi.getTeamMembers(currentTeamId);
        const members = normalizeList(membersResponse);

        console.log("TEAM HISTORY:", teamHistory);
        console.log("CURRENT TEAM:", currentTeam);
        console.log("TEAM MEMBERS RAW:", membersResponse);
        console.log("TEAM MEMBERS NORMALIZED:", members);

        setTeam({
          ...currentTeam,
          members,
        });
      } catch (memberError) {
        console.warn(
          "Failed to load members, rendering team history instead:",
          memberError,
        );
        setTeam(currentTeam);
      }
    } catch (error: any) {
      console.error("Load my team failed:", error);

      Swal.fire({
        icon: "error",
        title: "Error Loading Team",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Unable to get current team information.",
      });
      setTeamHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();

    const handler = () => {
      fetchMyTeam();
    };

    window.addEventListener("player-team-updated", handler);
    return () => {
      window.removeEventListener("player-team-updated", handler);
    };
  }, []);

  const teamId = getTeamId(team);
  const teamMembers = getMembers(team);
  const maxMembers = Number(team?.maxMembers || team?.maxMember || 5);
  const emptySlots = Math.max(0, maxMembers - teamMembers.length);
  const currentUserIsLeader = isLeaderTeam(team);

  const inviteLink =
    team?.inviteLink ||
    team?.joinLink ||
    team?.link ||
    (teamId ? `${window.location.origin}/team/join/${teamId}` : "");

  const handleCopy = async () => {
    if (!inviteLink) {
      Swal.fire({
        icon: "warning",
        title: "No Invite Link",
        text: "The backend did not return an invite link or teamId.",
      });
      return;
    }

    await navigator.clipboard.writeText(inviteLink);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSelectTeam = async (nextTeam: any) => {
    const nextTeamId = getTeamId(nextTeam);

    if (!nextTeamId || nextTeamId === teamId) return;

    localStorage.setItem("activeTeamId", nextTeamId);
    window.dispatchEvent(new Event("player-team-updated"));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Team Name",
        text: "Please enter a team name before creating.",
      });
      return;
    }

    try {
      setIsCreatingTeam(true);

      console.log("Creating team with payload:", {
        teamName: teamName.trim(),
      });

      const createResponse = await teamApi.createTeam({
        teamName: teamName.trim(),
      });

      const createdTeamId = getTeamId(unwrapData(createResponse));
      if (createdTeamId) localStorage.setItem("activeTeamId", createdTeamId);

      Swal.fire({
        icon: "success",
        title: "Team Created Successfully",
        text: "You are now the Team Leader. Please go to the Dashboard to select your Event / Track / Topic.",
      });

      setTeamName("");
      await fetchMyTeam();

      window.dispatchEvent(new Event("player-team-updated"));
    } catch (error: any) {
      console.error("Create team failed full error:", error);
      console.error("Create team status:", error.response?.status);
      console.error("Create team response data:", error.response?.data);

      const rawError = error.response?.data;

      const errorMessage =
        typeof rawError === "string"
          ? rawError
          : rawError?.message || rawError?.title || rawError?.errors
            ? JSON.stringify(rawError?.errors || rawError, null, 2)
            : "Backend refused to create the team.";

      Swal.fire({
        icon: "error",
        title: "Cannot Create Team",
        html: `<pre style="white-space:pre-wrap;text-align:left;font-size:12px">${errorMessage}</pre>`,
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleJoinTeam = async () => {
    const teamIdToJoin = extractTeamIdFromJoinInput(joinInput);

    if (!teamIdToJoin) {
      Swal.fire({
        icon: "warning",
        title: "Missing teamId or invite link",
        text: "Please enter the teamId or paste the team's invite link.",
      });
      return;
    }

    try {
      setIsJoiningTeam(true);

      await teamApi.joinViaLink(teamIdToJoin);
      localStorage.setItem("activeTeamId", teamIdToJoin);

      Swal.fire({
        icon: "success",
        title: "Joined Team Successfully",
        text: "You have joined the team as a Team Member.",
      });

      setJoinInput("");
      await fetchMyTeam();

      window.dispatchEvent(new Event("player-team-updated"));
    } catch (error: any) {
      console.error("Join team failed:", error);

      Swal.fire({
        icon: "error",
        title: "Cannot Join Team",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend refused the join team action.",
      });
    } finally {
      setIsJoiningTeam(false);
    }
  };

  const handleRenameTeam = async () => {
    const currentName = team?.teamName || team?.name || "";

    const { value: newName } = await Swal.fire({
      title: "Rename Team",
      input: "text",
      inputLabel: "Enter new team name",
      inputValue: currentName,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Team name cannot be empty!";
        }
      },
    });

    if (newName && newName.trim() !== currentName) {
      try {
        await teamApi.updateTeamInfo(teamId, { teamName: newName.trim() });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Team name has been updated!",
        });
        await fetchMyTeam();
        window.dispatchEvent(new Event("player-team-updated"));
      } catch (error: any) {
        console.error("Rename failed:", error);
        Swal.fire({
          icon: "error",
          title: "Cannot Rename",
          text:
            error.response?.data?.message || "Backend refused this action.",
        });
      }
    }
  };

  const confirmRemoveMember = async (memberPlayerId: string) => {
    try {
      if (!teamId) {
        Swal.fire(
          "Missing teamId",
          "Unable to identify the current team.",
          "error",
        );
        return;
      }

      if (!memberPlayerId) {
        Swal.fire(
          "Missing memberPlayerId",
          "Unable to identify the member to kick.",
          "error",
        );
        return;
      }

      await teamApi.kickMember(teamId, memberPlayerId);

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      await fetchMyTeam();

      Swal.fire({
        icon: "success",
        title: "Kicked Member",
        text: "The member has been removed from the team.",
      });
    } catch (error: any) {
      console.error("Kick member failed:", error);

      Swal.fire({
        icon: "error",
        title: "Cannot Kick Member",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend refused this action.",
      });
    }
  };

  const handleRemoveMember = (memberPlayerId: string, memberName: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Kick Team Member",
      description: `Are you sure you want to kick ${memberName} from the team?`,
      confirmText: "Kick Member",
      onConfirm: () => {
        void confirmRemoveMember(memberPlayerId);
      },
    });
  };

  const confirmTransferLeader = async (newLeaderPlayerId: string) => {
    try {
      if (!teamId) return;
      await teamApi.transferLeader(teamId, newLeaderPlayerId);

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      await fetchMyTeam();

      Swal.fire({
        icon: "success",
        title: "Transfer Successful",
        text: "You have transferred the Team Leader role. You are now a Team Member.",
      });
      window.dispatchEvent(new Event("player-team-updated"));
    } catch (error: any) {
      console.error("Transfer leader failed:", error);
      Swal.fire({
        icon: "error",
        title: "Cannot Transfer Role",
        text: error.response?.data?.message || "Backend refused this action.",
      });
    }
  };

  const handleTransferClick = (memberPlayerId: string, memberName: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Transfer Team Leader",
      description: `Are you sure you want to transfer the Team Leader role to ${memberName}? You will lose team management rights.`,
      confirmText: "Confirm Transfer",
      onConfirm: () => {
        void confirmTransferLeader(memberPlayerId);
      },
    });
  };

  const confirmLeaveTeam = async () => {
    try {
      if (!teamId) {
        Swal.fire(
          "Missing teamId",
          "Unable to identify the current team.",
          "error",
        );
        return;
      }

      await teamApi.leaveTeam(teamId);

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      localStorage.removeItem("activeTeamId");
      await fetchMyTeam();

      window.dispatchEvent(new Event("player-team-updated"));

      Swal.fire({
        icon: "success",
        title: "Left Team",
        text: "You have successfully left the current team.",
      });
    } catch (error: any) {
      console.error("Leave team failed:", error);

      Swal.fire({
        icon: "error",
        title: "Cannot Leave Team",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend refused the leave team action.",
      });
    }
  };

  const handleLeaveTeam = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Leave Team",
      description: "Are you sure you want to leave this team?",
      confirmText: "Leave Team",
      onConfirm: () => {
        void confirmLeaveTeam();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500 max-w-4xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            My Team
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Loading team information...
          </p>
        </header>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="animate-in fade-in duration-500 max-w-5xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            My Team
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            You don't have a team yet. You can create a new team to become a Team Leader,
            or join an existing team as a Team Member.
          </p>
        </header>

        {teamHistory.length > 0 && (
          <TeamSwitcher
            teams={teamHistory}
            activeTeamId={teamId}
            onSelect={handleSelectTeam}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-radius-lg p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create a new team
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                The team creator will become the Team Leader. Only then will you have the right
                to choose the Event / Track / Topic and Submit Project.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Team name
              </label>

              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Example: Tech Wizards"
                className="w-full px-4 py-3 border border-gray-200 rounded-radius-md outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={isCreatingTeam}
              className="w-full px-6 py-3 bg-black text-white rounded-radius-md font-bold disabled:opacity-50"
            >
              {isCreatingTeam ? "Creating team..." : "+ Create Team"}
            </button>

            <p className="text-xs text-gray-500 leading-relaxed">
              After creating a team successfully, the Sidebar will show a Submit
              Project button because you are now a Team Leader.
            </p>
          </section>

          <section className="bg-white border border-gray-200 rounded-radius-lg p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Join existing team
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Join a team using a teamId or invite link. The person joining will be a Team
                Member.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Team invite link / teamId
              </label>

              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste invite link or teamId"
                className="w-full px-4 py-3 border border-gray-200 rounded-radius-md outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinTeam}
              disabled={isJoiningTeam}
              className="w-full px-6 py-3 bg-white text-black border border-black rounded-radius-md font-bold disabled:opacity-50 hover:bg-gray-50"
            >
              {isJoiningTeam ? "Joining team..." : "Join Team"}
            </button>

            <p className="text-xs text-gray-500 leading-relaxed">
              After joining the team, you are still a Team Member so the Sidebar will not
              show Submit Project.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          My Team
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your team here. You can invite teammates, kick members, or
          transfer leadership if you are the Team Leader.
        </p>
      </header>

      <div className="space-y-8">
        {teamHistory.length > 0 && (
          <TeamSwitcher
            teams={teamHistory}
            activeTeamId={teamId}
            onSelect={handleSelectTeam}
          />
        )}

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
                  value={inviteLink || "Backend did not return an invite link"}
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

            <p className="text-xs text-muted-foreground font-medium"></p>
          </div>
        </section>

        {!currentUserIsLeader && (
          <section className="bg-white border border-border rounded-radius-lg p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg text-foreground">
                Team Member Mode
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                You are a member of this team. You cannot kick other members, but you can leave the team.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLeaveTeam}
              className="px-4 py-3 text-sm font-bold text-red-600 border border-red-200 rounded-radius-md hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              Leave Team
            </button>
          </section>
        )}

        <section className="bg-card border border-border rounded-radius-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div>
              <h2 className="font-bold text-lg">Team Roster</h2>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl font-bold text-foreground">
                  {team?.teamName || team?.name || "Current Team"}
                </h2>
                {currentUserIsLeader && (
                  <button
                    onClick={handleRenameTeam}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-radius-sm"
                    title="Rename team"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
              {teamMembers.length} / {maxMembers} Members
            </span>
          </div>

          <div className="divide-y divide-border">
            {teamMembers.length === 0 ? (
              <div className="text-muted-foreground py-10 text-center bg-muted/20 rounded-radius-md border border-border border-dashed">
                Backend did not return a member list.
              </div>
            ) : (
              teamMembers.map((member: any, index: number) => {
                const self = isSelfMember(
                  member,
                  index,
                  currentUserInfo,
                  currentUserIsLeader,
                );

                const memberPlayerId = String(getMemberPlayerId(member) || "");

                const memberName = resolveMemberName(
                  member,
                  index,
                  !!self,
                  currentUserInfo,
                );

                const memberRole = resolveMemberRole(
                  member,
                  index,
                  currentUserIsLeader,
                  !!self,
                );

                return (
                  <div
                    key={memberPlayerId || `${memberName}-${index}`}
                    className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                        {getInitials(memberName)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-base">
                            {resolveMemberName(
                              member,
                              index,
                              !!self,
                              currentUserInfo,
                            ) || `Member ${index + 1}`}
                          </h3>

                          {isLeaderMember(member) && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              Leader
                            </span>
                          )}

                          {self && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground border border-border">
                              You
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-sm font-medium ${
                            memberRole === "Team Leader"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {memberRole}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      if (self) {
                        if (currentUserIsLeader) {
                          return (
                            <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                              Leader
                            </span>
                          );
                        } else {
                          return (
                            <button
                              type="button"
                              onClick={handleLeaveTeam}
                              className="text-sm font-medium text-red-600 hover:bg-red-50 transition-colors px-3 py-2 rounded-radius-md"
                            >
                              Leave Team
                            </button>
                          );
                        }
                      }

                      if (currentUserIsLeader) {
                        if (isLeaderMember(member)) {
                          return (
                            <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                              Leader
                            </span>
                          );
                        }

                        if (memberPlayerId) {
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleTransferClick(
                                    memberPlayerId,
                                    memberName,
                                  )
                                }
                                className="text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors px-3 py-2 rounded-radius-md border border-amber-200"
                              >
                                Transfer Leader
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMember(memberPlayerId, memberName)
                                }
                                className="text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors px-3 py-2 rounded-radius-md"
                              >
                                Kick
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                              Cannot interact
                            </span>
                          );
                        }
                      }

                      // Member view for other members.
                      if (isLeaderMember(member)) {
                        return (
                          <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                            Leader
                          </span>
                        );
                      }

                      return (
                        <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                          Member
                        </span>
                      );
                    })()}
                    {/* End member action area. */}
                  </div>
                );
              })
            )}

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

                {currentUserIsLeader ? (
                  <button
                    onClick={handleCopy}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    Waiting
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-radius-lg p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create another team
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a new team for a different event. The backend will keep
                event membership rules consistent.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Team name
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Example: Tech Wizards"
                className="w-full px-4 py-3 border border-gray-200 rounded-radius-md outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={isCreatingTeam}
              className="w-full px-6 py-3 bg-black text-white rounded-radius-md font-bold disabled:opacity-50"
            >
              {isCreatingTeam ? "Creating team..." : "+ Create Team"}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-radius-lg p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Join another team
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Paste a team invite link or teamId. If you already joined a
                team in the same event, the join API will reject it.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Team invite link / teamId
              </label>
              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste invite link or teamId"
                className="w-full px-4 py-3 border border-gray-200 rounded-radius-md outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinTeam}
              disabled={isJoiningTeam}
              className="w-full px-6 py-3 bg-white text-black border border-black rounded-radius-md font-bold disabled:opacity-50 hover:bg-gray-50"
            >
              {isJoiningTeam ? "Joining team..." : "Join Team"}
            </button>
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
        isDestructive
      />
    </div>
  );
}

function TeamSwitcher({
  teams,
  activeTeamId,
  onSelect,
}: {
  teams: any[];
  activeTeamId: string;
  onSelect: (team: any) => void | Promise<void>;
}) {
  if (teams.length === 0) return null;

  return (
    <section className="bg-white border border-border rounded-radius-lg p-4 shadow-sm mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Your Teams
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose a team to view its Dashboard, roster, and submit permission.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {teams.length} team{teams.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {teams.map((item) => {
          const itemTeamId = getTeamId(item);
          const isActive = itemTeamId && itemTeamId === activeTeamId;
          const eventName = getTeamEventName(item);
          const trackName = getTeamTrackName(item);
          const topicName = getTeamTopicName(item);
          const detailLine =
            [eventName, trackName, topicName].filter(Boolean).join(" / ") ||
            "No event selected yet";

          return (
            <button
              type="button"
              key={itemTeamId || getTeamDisplayName(item)}
              onClick={() => void onSelect(item)}
              className={`w-full text-left border rounded-radius-md p-4 transition-colors ${
                isActive
                  ? "border-black bg-black text-white"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold truncate">
                    {getTeamDisplayName(item)}
                  </p>
                  <p
                    className={`text-sm mt-1 truncate ${
                      isActive ? "text-white/70" : "text-slate-500"
                    }`}
                    title={detailLine}
                  >
                    {detailLine}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                      isActive
                        ? "bg-white text-black"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {isLeaderTeam(item) ? "Leader" : "Member"}
                  </span>
                  {isActive && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/70">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
