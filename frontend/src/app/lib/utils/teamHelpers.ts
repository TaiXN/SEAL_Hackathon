export const unwrapData = (value: any) => value?.data ?? value;

export const normalizeList = (value: any): any[] => {
  const data = unwrapData(value);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;

  return [];
};

export const normalizeId = (id: any): string =>
  String(id || "")
    .toLowerCase()
    .trim();

export const getTeamId = (team: any): string => {
  return normalizeId(
    team?.submission?.teamInRound?.teamId ||
      team?.submission?.teamInRound?.teamID ||
      team?.teamInRound?.teamId ||
      team?.teamInRound?.teamID ||
      team?.teamId ||
      team?.teamID ||
      team?.id ||
      team?.team?.teamId ||
      team?.team?.teamID ||
      "",
  );
};

export const getCurrentTeamFromHistory = (history: any[]) => {
  if (!history || history.length === 0) return null;

  const savedTeamId =
    typeof window !== "undefined" ? localStorage.getItem("activeTeamId") : null;

  if (savedTeamId === "NEW") return null;

  if (savedTeamId) {
    const found = history.find(
      (team) => getTeamId(team) === normalizeId(savedTeamId),
    );
    if (found) return found;
  }

  const defaultTeam =
    history.find((item) => item?.isActive === true) ||
    history.find((item) => item?.status !== "Deleted") ||
    history[0] ||
    null;

  const defaultTeamId = getTeamId(defaultTeam);

  if (defaultTeam && defaultTeamId && typeof window !== "undefined") {
    localStorage.setItem("activeTeamId", defaultTeamId);
  }

  return defaultTeam;
};

export const isLeaderTeam = (team: any): boolean => {
  const rawRole = String(
    team?.role || team?.teamRole || team?.memberRole || team?.position || "",
  )
    .toLowerCase()
    .trim();

  return (
    team?.isLeader === true ||
    team?.isLeader === 1 ||
    team?.leader === true ||
    team?.isTeamLeader === true ||
    rawRole === "leader" ||
    rawRole === "team leader" ||
    rawRole === "teamleader" ||
    rawRole.includes("leader")
  );
};

export const readBooleanFlag = (value: any): boolean => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "banned", "ban", "eliminated"].includes(
      normalized,
    );
  }
  return false;
};

export const isBannedAccount = (...sources: any[]): boolean =>
  sources.some((source) =>
    readBooleanFlag(
      source?.isBanned ??
        source?.IsBanned ??
        source?.isBan ??
        source?.IsBan ??
        source?.banned ??
        source?.Banned ??
        source?.accountBanned ??
        source?.AccountBanned ??
        source?.playerBanned ??
        source?.PlayerBanned ??
        source?.studentBanned ??
        source?.StudentBanned,
    ),
  );

export const isEliminatedTeam = (...sources: any[]): boolean =>
  sources.some((source) =>
    readBooleanFlag(
      source?.isEliminated ??
        source?.IsEliminated ??
        source?.iseliminated ??
        source?.eliminated ??
        source?.Eliminated ??
        source?.teamInRound?.isEliminated ??
        source?.teamInRound?.IsEliminated ??
        source?.team?.isEliminated ??
        source?.team?.IsEliminated,
    ),
  );

export const getBanReason = (...sources: any[]): string => {
  for (const source of sources) {
    const reason =
      source?.banReason ||
      source?.BanReason ||
      source?.bannedReason ||
      source?.BannedReason ||
      source?.reason ||
      source?.Reason;
    if (typeof reason === "string" && reason.trim()) return reason.trim();
  }
  return "";
};

export const hasTeamEventRegistration = (team: any): boolean => {
  const eventName = String(
    team?.eventName ||
      team?.EventName ||
      team?.event?.eventName ||
      team?.event?.name ||
      "",
  )
    .trim()
    .toLowerCase();

  return Boolean(
    team?.eventId ||
      team?.eventID ||
      team?.EventID ||
      team?.teamInRound ||
      (eventName &&
        ![
          "not registered",
          "no event",
          "you not in an event",
          "you are not in an event",
          "not in an event",
        ].includes(eventName)),
  );
};

export const teamHasBannedMember = (team: any): boolean => {
  const members = team?.members || team?.teamMembers || team?.players || [];
  return Array.isArray(members) && members.some((member) => isBannedAccount(member));
};
