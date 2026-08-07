import { useEffect, useState } from "react";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Swal from "sweetalert2";
import { prizeApi } from "../../../lib/api/prizeApi";
import {
  showApiError,
  friendlyErrorText,
  technicalDetails,
} from "../../../lib/utils/apiError";
import type { EventPhase } from "../../../lib/utils/eventLifecycle";

const BRAND = "#f26f21";

const prizeIdOf = (p: any) => String(p.prizeId ?? p.prizeID ?? p.id ?? "");
const teamIdOf = (t: any) => String(t.teamId ?? t.teamID ?? t.id ?? "");
const teamNameOf = (t: any) =>
  t.teamName ?? t.name ?? t.TeamName ?? "Unnamed team";

const esc = (s: string) => String(s ?? "").replace(/"/g, "&quot;");

const rankLabel = (i: number) => {
  const n = Number(i);
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

type Props = {
  eventId: string;
  phase: EventPhase;
  canEdit: boolean;
  /** Bảng xếp hạng chung kết, đã sắp xếp điểm giảm dần. */
  finalStandings: any[];
};

export function PrizesSection({
  eventId,
  phase,
  canEdit,
  finalStandings,
}: Props) {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await prizeApi.getPrizesByEvent(eventId);
      const sorted = [...list].sort(
        (a, b) => Number(a.rankIndex ?? 0) - Number(b.rankIndex ?? 0),
      );
      setPrizes(sorted);
    } catch (e) {
      setError(friendlyErrorText(e, { action: "load the prizes for this event" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const promptPrize = async (existing?: any) => {
    const nextRank = prizes.length
      ? Math.max(...prizes.map((p) => Number(p.rankIndex ?? 0))) + 1
      : 1;
    const { value } = await Swal.fire({
      title: existing ? "Edit Prize" : "Add Prize",
      html: `
        <div style="text-align:left; padding:0 8px;">
          <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Prize name</label>
          <input id="pz-name" class="swal2-input" style="width:100%;margin:6px 0 16px;border-radius:12px;font-size:14px;" value="${esc(existing?.prizeName ?? "")}" placeholder="Champion, Runner-up...">
          <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Description</label>
          <input id="pz-desc" class="swal2-input" style="width:100%;margin:6px 0 16px;border-radius:12px;font-size:14px;" value="${esc(existing?.description ?? "")}" placeholder="Cash prize, trophy...">
          <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Awarded to rank</label>
          <input id="pz-rank" type="number" min="1" class="swal2-input" style="width:100%;margin:6px 0 4px;border-radius:12px;font-size:14px;" value="${Number(existing?.rankIndex ?? nextRank)}">
          <p style="font-size:11px;color:#94a3b8;margin:0;">Rank 1 goes to the highest-scoring team of the final round.</p>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: existing ? "Save" : "Add Prize",
      confirmButtonColor: BRAND,
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () => {
        const prizeName = (
          document.getElementById("pz-name") as HTMLInputElement
        ).value.trim();
        const description = (
          document.getElementById("pz-desc") as HTMLInputElement
        ).value.trim();
        const rankIndex = Number(
          (document.getElementById("pz-rank") as HTMLInputElement).value,
        );
        if (!prizeName) {
          Swal.showValidationMessage("Prize name cannot be empty");
          return false;
        }
        if (!description) {
          // Backend đánh dấu description là bắt buộc, gửi rỗng sẽ bị 400.
          Swal.showValidationMessage("Description cannot be empty");
          return false;
        }
        if (!rankIndex || rankIndex < 1) {
          Swal.showValidationMessage("Rank must be at least 1");
          return false;
        }
        const clash = prizes.find(
          (p) =>
            Number(p.rankIndex ?? 0) === rankIndex &&
            prizeIdOf(p) !== prizeIdOf(existing ?? {}),
        );
        if (clash) {
          Swal.showValidationMessage(
            `Rank ${rankIndex} is already taken by "${clash.prizeName}"`,
          );
          return false;
        }
        return { prizeName, description, rankIndex };
      },
    });
    if (!value) return;

    try {
      if (existing) {
        await prizeApi.updatePrize(prizeIdOf(existing), value);
      } else {
        await prizeApi.createPrize({ ...value, eventId });
      }
      await load();
      Swal.fire({
        icon: "success",
        title: existing ? "Updated!" : "Added!",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (e) {
      showApiError(e, {
        action: existing ? "update this prize" : "add this prize",
        hint: "Each rank can only hold one prize — check that the rank isn't already taken.",
      });
    }
  };

  const handleDelete = async (prize: any) => {
    const ok = await Swal.fire({
      title: "Delete Prize?",
      html: `Remove <b>${prize.prizeName}</b> from this event?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      customClass: { popup: "rounded-[2rem]" },
    });
    if (!ok.isConfirmed) return;
    try {
      await prizeApi.deletePrize(prizeIdOf(prize));
      await load();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (e) {
      showApiError(e, { action: "delete this prize" });
    }
  };

  const handleAssign = async (prize: any) => {
    if (finalStandings.length === 0) {
      return Swal.fire(
        "No standings yet",
        "There are no ranked teams to award this prize to.",
        "info",
      );
    }
    const options = finalStandings
      .map(
        (t, i) =>
          `<option value="${teamIdOf(t)}">#${i + 1} — ${esc(teamNameOf(t))} (${Number(t.score ?? 0).toFixed(2)} pts)</option>`,
      )
      .join("");
    const { value: teamId } = await Swal.fire({
      title: `Award "${prize.prizeName}"`,
      html: `<select id="pz-team" class="swal2-select" style="width:90%;border-radius:12px;">${options}</select>`,
      showCancelButton: true,
      confirmButtonText: "Award Prize",
      confirmButtonColor: BRAND,
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () =>
        (document.getElementById("pz-team") as HTMLSelectElement).value,
    });
    if (!teamId) return;
    try {
      await prizeApi.manualAssign(prize, teamId);
      await load();
      Swal.fire({
        icon: "success",
        title: "Awarded!",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      showApiError(e, {
        action: "award this prize",
        hint: "The prize may already have been awarded to another team.",
      });
    }
  };

  /**
   * Trao toàn bộ giải theo đúng thứ hạng chung cuộc: giải rankIndex = n về đội
   * đứng thứ n. Backend chưa có endpoint tự trao giải khi kết thúc sự kiện, nên
   * bước này do admin bấm, dùng chính API manual-assign cho từng giải.
   */
  const handleAutoAward = async () => {
    const assignable = prizes.filter(
      (p) => Number(p.rankIndex ?? 0) >= 1 && Number(p.rankIndex) <= finalStandings.length,
    );
    if (assignable.length === 0) {
      return Swal.fire(
        "Nothing to award",
        "No prize has a rank that matches a team in the final standings.",
        "info",
      );
    }
    const preview = assignable
      .map(
        (p) =>
          `<li style="margin-bottom:4px;"><b>${esc(p.prizeName)}</b> → ${esc(
            teamNameOf(finalStandings[Number(p.rankIndex) - 1]),
          )}</li>`,
      )
      .join("");
    const ok = await Swal.fire({
      title: "Award prizes by final ranking?",
      html: `<ul style="text-align:left;font-size:14px;padding-left:18px;">${preview}</ul>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Award all",
      confirmButtonColor: BRAND,
      width: 560,
      customClass: { popup: "rounded-[2rem]" },
    });
    if (!ok.isConfirmed) return;

    const failures: string[] = [];
    for (const p of assignable) {
      const team = finalStandings[Number(p.rankIndex) - 1];
      try {
        await prizeApi.manualAssign(p, teamIdOf(team));
      } catch (e) {
        console.error(`Không trao được giải ${p.prizeName}`, technicalDetails(e), e);
        failures.push(p.prizeName);
      }
    }
    await load();
    if (failures.length) {
      Swal.fire({
        icon: "warning",
        title: "Some prizes were not awarded",
        html: `These prizes could not be awarded automatically:<br/><b>${esc(
          failures.join(", "),
        )}</b><br/><br/>They may already belong to a team. Award them one by one with the trophy button.`,
        width: 560,
        confirmButtonColor: BRAND,
        customClass: { popup: "rounded-[2rem]" },
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "All prizes awarded!",
        timer: 1400,
        showConfirmButton: false,
      });
    }
  };

  const canAward = phase === "ended";

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Trophy size={20} strokeWidth={2.5} />
            </div>
            Prizes & Awards
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-2 sm:ml-[3.25rem]">
            {canAward
              ? "Scores are final. Award each prize to the team that earned it."
              : "Prizes are handed out automatically by rank once the event ends."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAward && prizes.length > 0 && (
            <button
              onClick={handleAutoAward}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Sparkles size={16} strokeWidth={2.5} /> Award by ranking
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => promptPrize()}
              className="flex items-center gap-2 px-5 py-2.5 bg-fpt-orange-soft text-fpt-orange-dark text-xs font-extrabold rounded-xl hover:bg-fpt-orange/15 transition-colors"
            >
              <Plus size={16} strokeWidth={3} /> Add Prize
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-14 text-slate-400 font-bold uppercase tracking-widest text-sm">
          <Loader2 size={20} className="animate-spin text-[#f26f21]" /> Loading
          prizes...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-3 py-10 bg-red-50 rounded-2xl">
          <span className="flex items-center gap-2 text-sm text-red-600 font-bold">
            <AlertCircle size={18} strokeWidth={2.5} /> {error}
          </span>
          <button
            onClick={load}
            className="px-4 py-2 text-xs font-bold bg-white text-slate-700 rounded-xl shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={12} className="inline mr-1" /> Retry
          </button>
        </div>
      ) : prizes.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
          No prizes configured for this event.
          {canEdit && " Add one to reward the top teams."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {prizes.map((p) => {
            const awardedId = String(p.teamId ?? p.teamID ?? "");
            const awardedTeam = finalStandings.find(
              (t) => teamIdOf(t) === awardedId,
            );
            const awardedName =
              p.teamName ??
              (awardedTeam ? teamNameOf(awardedTeam) : awardedId || "");
            return (
              <div
                key={prizeIdOf(p)}
                className="border border-slate-200 rounded-[1.5rem] p-6 bg-slate-50/40 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] px-2.5 py-1 rounded-md bg-fpt-orange text-white font-black uppercase tracking-widest mb-2">
                      {rankLabel(p.rankIndex ?? 0)} place
                    </span>
                    <h4 className="font-extrabold text-lg text-[#f26f21] truncate">
                      {p.prizeName}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {p.description}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => promptPrize(p)}
                        title="Edit prize"
                        className="p-2 text-slate-400 hover:text-fpt-orange bg-white border border-slate-100 rounded-lg shadow-sm"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        title="Delete prize"
                        className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4 flex items-center justify-between gap-3">
                  {awardedName ? (
                    <span className="flex items-center gap-2 text-sm font-extrabold text-emerald-700">
                      <UserCheck size={16} strokeWidth={2.5} /> {awardedName}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Not awarded yet
                    </span>
                  )}
                  {canAward && (
                    <button
                      onClick={() => handleAssign(p)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-fpt-orange hover:border-fpt-orange/40 text-xs font-bold rounded-xl shadow-sm transition-colors"
                    >
                      {awardedName ? "Reassign" : "Award"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
