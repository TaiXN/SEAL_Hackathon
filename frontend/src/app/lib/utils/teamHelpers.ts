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
