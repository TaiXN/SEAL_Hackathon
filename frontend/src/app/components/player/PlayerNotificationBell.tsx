import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Loader2,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";
import { teamApi } from "../../lib/api/teamApi";
import { prizeApi } from "../../lib/api/prizeApi";
import {
  getCurrentTeamFromHistory,
  getTeamId,
  isLeaderTeam,
  normalizeList,
  unwrapData,
} from "../../lib/utils/teamHelpers";

type NotificationType = "event" | "prize";

type PlayerNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meta: string;
  teamName: string;
};

const READ_STORAGE_KEY = "playerNotification.readIds";

const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const getTeamName = (team: any): string =>
  readString(team?.teamName || team?.TeamName || team?.name, "Unnamed Team");

const getEventId = (event: any): string =>
  readString(event?.eventId || event?.eventID || event?.EventID || event?.id);

const getEventName = (event: any): string =>
  readString(
    event?.eventName || event?.EventName || event?.name,
    "Registered event",
  );

const getEventRecords = (team: any): any[] => {
  const events = team?.events || team?.Events || team?.registeredEvents;
  if (Array.isArray(events)) return events;

  if (team?.eventId || team?.eventName) {
    return [
      {
        eventId: team.eventId,
        eventName: team.eventName,
      },
    ];
  }

  return [];
};

const normalizeAwardList = (value: any): any[] => {
  const data = unwrapData(value);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.awards)) return data.awards;
  if (Array.isArray(data?.prizes)) return data.prizes;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  if (
    data &&
    typeof data === "object" &&
    (data.prizeName || data.awardName || data.rankIndex || data.description)
  ) {
    return [data];
  }

  return [];
};

const getAwardName = (award: any): string =>
  readString(
    award?.prizeName ||
      award?.awardName ||
      award?.rankName ||
      award?.title ||
      award?.name,
    "Prize",
  );

const getAwardDescription = (award: any): string =>
  readString(
    award?.description ||
      award?.reward ||
      award?.amount ||
      award?.prizeDescription,
  );

const getRankText = (award: any): string => {
  const rank = award?.rankIndex || award?.rank || award?.place;
  if (rank === undefined || rank === null || rank === "") return "";
  return `Rank ${rank}`;
};

const getReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveReadIds = (ids: Set<string>) => {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
};

export function PlayerNotificationBell() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.has(item.id)).length,
    [notifications, readIds],
  );

  const markAllRead = (items = notifications) => {
    const next = new Set(readIds);
    items.forEach((item) => next.add(item.id));
    setReadIds(next);
    saveReadIds(next);
  };

  const loadNotifications = async () => {
    setLoading(true);

    try {
      const historyResponse = await teamApi.getMyTeamsHistory();
      const history = normalizeList(historyResponse);
      const currentTeam = getCurrentTeamFromHistory(history);
      const currentTeamId = getTeamId(currentTeam);
      const teams = currentTeamId
        ? history.filter((team) => getTeamId(team) === currentTeamId)
        : history;

      const eventNotifications: PlayerNotification[] = [];
      const prizeRequests: Array<Promise<PlayerNotification[]>> = [];
      const seenEvents = new Set<string>();

      teams.forEach((team) => {
        const teamId = getTeamId(team);
        if (!teamId) return;

        const teamName = getTeamName(team);
        const role = isLeaderTeam(team) ? "Team Leader" : "Team Member";

        getEventRecords(team).forEach((event) => {
          const eventId = getEventId(event);
          const eventName = getEventName(event);
          const eventKey = `${teamId}:${eventId || eventName}`;

          if (!eventId && !eventName) return;
          if (seenEvents.has(eventKey)) return;
          seenEvents.add(eventKey);

          eventNotifications.push({
            id: `event:${eventKey}`,
            type: "event",
            title: eventName,
            message: `${teamName} is registered for this event.`,
            meta: role,
            teamName,
          });

          if (eventId) {
            prizeRequests.push(
              prizeApi
                .getTeamAwards(eventId, teamId)
                .then((response) =>
                  normalizeAwardList(response).map((award, index) => {
                    const awardName = getAwardName(award);
                    const description = getAwardDescription(award);
                    const rank = getRankText(award);

                    return {
                      id: `prize:${teamId}:${eventId}:${award?.prizeId || award?.awardId || awardName}:${index}`,
                      type: "prize" as const,
                      title: awardName,
                      message:
                        description ||
                        `${teamName} received a prize in ${eventName}.`,
                      meta: [eventName, rank].filter(Boolean).join(" - "),
                      teamName,
                    };
                  }),
                )
                .catch(() => []),
            );
          }
        });
      });

      const prizeNotifications = (await Promise.all(prizeRequests)).flat();
      setNotifications([...prizeNotifications, ...eventNotifications]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handler = () => {
      loadNotifications();
    };

    window.addEventListener("player-team-updated", handler);

    return () => {
      window.removeEventListener("player-team-updated", handler);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const togglePanel = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      markAllRead();
    }
  };

  return (
    <div className="fixed right-6 top-5 z-40" ref={panelRef}>
      <button
        type="button"
        onClick={togglePanel}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:border-orange-200 hover:text-[#f26f21]"
        aria-label="Open player notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={2.4} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#f26f21] px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f26f21]">
                Notifications
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">
                Prizes & Events
              </h3>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={loadNotifications}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-[#f26f21]"
                aria-label="Refresh notifications"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[440px] overflow-y-auto p-3">
            {notifications.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <CheckCheck className="h-9 w-9 text-emerald-500" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  No notifications yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Prize and event updates will appear here.
                </p>
              </div>
            )}

            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm font-bold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            )}

            {notifications.map((item) => {
              const Icon = item.type === "prize" ? Trophy : CalendarDays;
              const unread = !readIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`mb-2 flex gap-3 rounded-lg border p-3 ${
                    item.type === "prize"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      item.type === "prize"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-orange-100 text-[#f26f21]"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-950">
                        {item.title}
                      </p>
                      {unread && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f26f21]" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                      {item.message}
                    </p>
                    <p className="mt-2 truncate text-xs font-bold uppercase tracking-wide text-slate-400">
                      {item.teamName} {item.meta ? `- ${item.meta}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
