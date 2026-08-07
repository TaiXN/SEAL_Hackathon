import { useEffect, useState } from "react";
import {
  Scale,
  GraduationCap,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
  Mail,
} from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "../../../lib/api/apiClient";
import { judgeApi } from "../../../lib/api/judgeApi";
import { mentorApi } from "../../../lib/api/mentorApi";
import { showApiError, friendlyErrorText } from "../../../lib/utils/apiError";
import { keepActive } from "../../../lib/utils/softDelete";

const BRAND = "#f26f21";

/** Judge và mentor đều là Teacher, chỉ khác vai trò gán vào track. */
type StaffRole = "judge" | "mentor";

type StaffMember = {
  id: string;
  name: string;
  email: string;
};

const toList = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

/**
 * Payload giáo viên trả về khác nhau tùy endpoint: /api/Judge/track dùng
 * teacherId/fullName, /api/Mentor/track đã được mentorApi chuẩn hóa thành
 * id/name/email. Gom hết về một dạng để hai cột render giống nhau.
 */
const normalizeStaff = (raw: any): StaffMember | null => {
  if (!raw) return null;
  const id = String(
    raw.teacherId ??
      raw.teacherID ??
      raw.judgeId ??
      raw.judgeID ??
      raw.mentorId ??
      raw.mentorID ??
      raw.id ??
      raw.ID ??
      "",
  ).trim();
  if (!id) return null;
  const name = String(
    raw.fullName ??
      raw.FullName ??
      raw.teacherName ??
      raw.TeacherName ??
      raw.judgeName ??
      raw.mentorName ??
      raw.name ??
      "",
  ).trim();
  const email = String(
    raw.email ?? raw.Email ?? raw.teacherEmail ?? raw.gmail ?? raw.Gmail ?? "",
  ).trim();
  return { id, name: name || "Unnamed teacher", email };
};

const dedupe = (list: (StaffMember | null)[]): StaffMember[] => {
  const seen = new Set<string>();
  return list.filter((s): s is StaffMember => {
    if (!s) return false;
    const key = s.id.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeStaffList = (value: any): StaffMember[] =>
  dedupe(keepActive(toList(value)).map(normalizeStaff));

/**
 * Gom mọi chuỗi có thể là id trong một bản ghi (kể cả lồng một cấp), ưu tiên
 * field có tên nghe như id giáo viên. Dùng để dò id thật mà không cần biết
 * trước backend đặt tên field là gì.
 */
const collectIdCandidates = (raw: any): string[] => {
  const preferred: string[] = [];
  const others: string[] = [];
  const visit = (val: any, key: string, depth: number) => {
    if (val === null || val === undefined || depth > 2) return;
    if (typeof val === "string") {
      const s = val.trim();
      if (!s) return;
      const k = key.toLowerCase();
      if (
        k === "id" ||
        (k.includes("id") &&
          (k.includes("teacher") || k.includes("judge") || k.includes("mentor")))
      ) {
        preferred.push(s);
      } else {
        others.push(s);
      }
      return;
    }
    if (typeof val === "object" && !Array.isArray(val)) {
      for (const [k, v] of Object.entries(val)) visit(v, k, depth + 1);
    }
  };
  visit(raw, "", 0);
  return [...preferred, ...others];
};

/** teacherId (mọi biến thể) -> hồ sơ giáo viên, dựng từ GET /api/Teacher. */
type TeacherDirectory = Map<string, StaffMember>;

const buildDirectory = (value: any): TeacherDirectory => {
  const dir: TeacherDirectory = new Map();
  for (const raw of toList(value)) {
    const person = normalizeStaff(raw);
    if (!person) continue;
    // Đăng ký dưới MỌI id của bản ghi: endpoint gán việc có thể trả về
    // accountId thay vì teacherId, khớp kiểu nào cũng ra đúng người.
    for (const candidate of collectIdCandidates(raw)) {
      const key = candidate.toLowerCase();
      if (!dir.has(key)) dir.set(key, person);
    }
  }
  return dir;
};

/**
 * GET /api/Judge/track/{id} và /api/Mentor/track/{id} chỉ trả về bản ghi phân
 * công, KHÔNG kèm tên/email giáo viên — đọc trần thì cột nào cũng ra
 * "Unnamed teacher". Nên tra ngược danh bạ giáo viên bằng id.
 *
 * Việc này còn sửa luôn một lỗi ngầm: id lấy được phải đúng là teacherId thì
 * nút gỡ (DELETE .../teacher/{id}) mới bắn trúng, mà chỉ có đối chiếu danh bạ
 * mới phân biệt được teacherId với id của chính bản ghi phân công.
 */
const resolveStaffList = (
  value: any,
  directory: TeacherDirectory,
): StaffMember[] =>
  dedupe(
    keepActive(toList(value)).map((raw) => {
      for (const candidate of collectIdCandidates(raw)) {
        const hit = directory.get(candidate.toLowerCase());
        if (hit) return hit;
      }
      return normalizeStaff(raw);
    }),
  );

const trackIdOf = (t: any) =>
  String(t?.trackID ?? t?.trackId ?? t?.id ?? "").trim();
const trackNameOf = (t: any) =>
  String(t?.trackName ?? t?.name ?? "").trim() || "Unnamed track";

const esc = (s: string) => String(s ?? "").replace(/"/g, "&quot;");

const ROLE_META: Record<
  StaffRole,
  { label: string; plural: string; icon: any; tone: string; empty: string }
> = {
  judge: {
    label: "Judge",
    plural: "Judges",
    icon: Scale,
    tone: "bg-indigo-50 text-indigo-600",
    empty: "No judge is scoring this track yet.",
  },
  mentor: {
    label: "Mentor",
    plural: "Mentors",
    icon: GraduationCap,
    tone: "bg-emerald-50 text-emerald-600",
    empty: "No mentor is supporting this track yet.",
  },
};

type Props = {
  /** Bảng của sự kiện, đã lọc bỏ bản ghi xóa mềm ở EventDetailsPage. */
  tracks: any[];
  canEdit: boolean;
};

export function StaffSection({ tracks, canEdit }: Props) {
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [judges, setJudges] = useState<StaffMember[]>([]);
  const [mentors, setMentors] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chọn sẵn bảng đầu tiên để admin mở tab lên là thấy dữ liệu ngay.
  useEffect(() => {
    if (tracks.length === 0) {
      setSelectedTrackId("");
      return;
    }
    const stillThere = tracks.some((t) => trackIdOf(t) === selectedTrackId);
    if (!stillThere) setSelectedTrackId(trackIdOf(tracks[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const load = async (trackId: string) => {
    if (!trackId) {
      setJudges([]);
      setMentors([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Hỏi song song: ba endpoint độc lập nhau, chờ tuần tự chỉ tổ chậm.
      const [judgeRes, mentorRes, teacherRes] = await Promise.all([
        judgeApi.getJudgesByTrack(trackId),
        mentorApi.getMentorsByTrack(trackId),
        // Danh bạ KHÔNG lọc xóa mềm: giáo viên đã nghỉ mà vẫn còn phân công thì
        // vẫn phải tra ra tên, nếu không dòng đó lại hiện "Unnamed teacher".
        apiClient.get("/api/Teacher"),
      ]);
      const directory = buildDirectory(teacherRes.data);
      setJudges(resolveStaffList(judgeRes, directory));
      setMentors(resolveStaffList(mentorRes, directory));
    } catch (e) {
      setError(
        friendlyErrorText(e, {
          action: "load the judges and mentors for this track",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedTrackId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackId]);

  const handleAssign = async (role: StaffRole) => {
    const meta = ROLE_META[role];
    const assigned = role === "judge" ? judges : mentors;

    let pool: StaffMember[] = [];
    try {
      // Cache-buster: danh sách này đổi ngay sau mỗi lần gán, giống CreateEvents.
      const res = await apiClient.get(`/api/Teacher/available?t=${Date.now()}`);
      pool = normalizeStaffList(res.data);
    } catch (e) {
      return showApiError(e, { action: "load the list of available teachers" });
    }

    const taken = new Set(assigned.map((s) => s.id.toLowerCase()));
    const options = pool.filter((t) => !taken.has(t.id.toLowerCase()));

    if (options.length === 0) {
      return Swal.fire(
        "No one left to assign",
        `Every available teacher is already a ${meta.label.toLowerCase()} on this track. Create a new teacher account first if you need more.`,
        "info",
      );
    }

    const { value: teacherId } = await Swal.fire({
      title: `Assign a ${meta.label}`,
      html: `<select id="staff-pick" class="swal2-select" style="width:90%;border-radius:12px;">
        ${options
          .map(
            (t) =>
              `<option value="${esc(t.id)}">${esc(t.name)}${
                t.email ? ` — ${esc(t.email)}` : ""
              }</option>`,
          )
          .join("")}
      </select>`,
      showCancelButton: true,
      confirmButtonText: "Assign",
      confirmButtonColor: BRAND,
      customClass: { popup: "rounded-[2rem]" },
      preConfirm: () =>
        (document.getElementById("staff-pick") as HTMLSelectElement).value,
    });
    if (!teacherId) return;

    try {
      if (role === "judge") {
        await judgeApi.assignJudgeToTrack(selectedTrackId, teacherId);
      } else {
        await mentorApi.assignMentor(selectedTrackId, teacherId);
      }
      await load(selectedTrackId);
      Swal.fire({
        icon: "success",
        title: "Assigned!",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (e) {
      showApiError(e, {
        action: `assign this ${meta.label.toLowerCase()}`,
        hint: "The teacher may already be assigned to this track.",
      });
    }
  };

  const handleRemove = async (role: StaffRole, person: StaffMember) => {
    const meta = ROLE_META[role];
    const ok = await Swal.fire({
      title: `Remove this ${meta.label.toLowerCase()}?`,
      html: `<b>${esc(person.name)}</b> will no longer ${
        role === "judge"
          ? "be able to score teams in this track"
          : "support the teams in this track"
      }.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove",
      customClass: { popup: "rounded-[2rem]" },
    });
    if (!ok.isConfirmed) return;

    try {
      if (role === "judge") {
        await judgeApi.removeJudgeFromTrack(selectedTrackId, person.id);
        setJudges((prev) => prev.filter((s) => s.id !== person.id));
      } else {
        await mentorApi.removeMentor(selectedTrackId, person.id);
        setMentors((prev) => prev.filter((s) => s.id !== person.id));
      }
      await load(selectedTrackId);
      Swal.fire({
        icon: "success",
        title: "Removed!",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (e) {
      showApiError(e, {
        action: `remove this ${meta.label.toLowerCase()}`,
        hint: "Judges who already scored a team may need those scores cleared first.",
      });
    }
  };

  const renderColumn = (role: StaffRole, people: StaffMember[]) => {
    const meta = ROLE_META[role];
    const Icon = meta.icon;
    return (
      <div className="border border-slate-200 rounded-[1.5rem] bg-slate-50/40 p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h4 className="flex items-center gap-3 font-extrabold text-[#f26f21]">
            <div className={`p-2 rounded-lg ${meta.tone}`}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
            {meta.plural}
            <span className="text-xs font-black text-slate-400">
              {people.length}
            </span>
          </h4>
          {canEdit && (
            <button
              onClick={() => handleAssign(role)}
              className="flex items-center gap-1.5 px-4 py-2 bg-fpt-orange-soft text-fpt-orange-dark text-[11px] font-extrabold rounded-xl hover:bg-fpt-orange/15 transition-colors"
            >
              <Plus size={14} strokeWidth={3} /> Assign
            </button>
          )}
        </div>

        {people.length === 0 ? (
          <p className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-sm text-slate-500 font-medium">
            {meta.empty}
          </p>
        ) : (
          <ul className="space-y-3">
            {people.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-700 truncate">
                    {p.name}
                  </p>
                  {p.email && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 truncate mt-0.5">
                      <Mail size={12} strokeWidth={2.5} /> {p.email}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleRemove(role, p)}
                    title={`Remove ${meta.label.toLowerCase()}`}
                    className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-sm shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-[#f26f21] flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Scale size={20} strokeWidth={2.5} />
            </div>
            Judges & Mentors
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-2 sm:ml-[3.25rem]">
            Judges and mentors are assigned per track. Pick a track to see who
            is responsible for it.
          </p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-center text-slate-500 font-medium">
          This event has no tracks yet. Add a track first, then assign judges
          and mentors to it.
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Track
            </label>
            <div className="relative">
              <Layers
                size={16}
                strokeWidth={2.5}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full sm:max-w-md pl-11 pr-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl outline-none font-bold text-[#f26f21] focus:bg-white focus:border-fpt-orange focus:ring-4 focus:ring-fpt-orange/10 transition-all"
              >
                {tracks.map((t) => (
                  <option key={trackIdOf(t)} value={trackIdOf(t)}>
                    {trackNameOf(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14 text-slate-400 font-bold uppercase tracking-widest text-sm">
              <Loader2 size={20} className="animate-spin text-[#f26f21]" />
              Loading staff...
            </div>
          ) : error ? (
            <div className="flex flex-wrap items-center justify-center gap-3 py-10 bg-red-50 rounded-2xl">
              <span className="flex items-center gap-2 text-sm text-red-600 font-bold">
                <AlertCircle size={18} strokeWidth={2.5} /> {error}
              </span>
              <button
                onClick={() => load(selectedTrackId)}
                className="px-4 py-2 text-xs font-bold bg-white text-slate-700 rounded-xl shadow-sm hover:bg-slate-50"
              >
                <RefreshCw size={12} className="inline mr-1" /> Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderColumn("judge", judges)}
              {renderColumn("mentor", mentors)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
