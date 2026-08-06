/**
 * Vòng đời sự kiện — NGUỒN SỰ THẬT DUY NHẤT cho cả admin portal.
 *
 * Sự kiện đi qua 4 giai đoạn:
 *
 *   draft         Vừa tạo xong. Chưa ai ngoài admin thấy được. Admin sửa/xóa
 *                 thoải mái track, round, rubric, prize.
 *   registration  Admin đã bấm "Open Registration" (PUT /api/Event/{id}/publish).
 *                 Sự kiện công khai, thí sinh lập team và đăng ký. Cấu hình bị
 *                 khóa, TRỪ hai việc cứu vãn khi không đủ chỉ tiêu: dời hạn đăng
 *                 ký và hạ số thành viên tối thiểu.
 *   running       Admin đã bấm "Start Round 1" (PUT /api/Event/{id}/start-round-1).
 *                 Form đăng ký đóng vĩnh viễn, các đội bắt đầu nộp bài.
 *   ended         Đã qua vòng cuối. Chỉ còn xem và trao giải.
 *
 * ⚠️ Vì sao hàm này phải dò nhiều tên field đến vậy: backend không trả về một
 * field "phase" nào cả, và tùy endpoint lại đặt tên/kiểu khác nhau. Trước đây
 * mỗi trang admin tự đoán một kiểu, dẫn tới sự kiện vừa tạo đã bị coi là đang mở
 * đăng ký — mất luôn nút "Open Registration" và khóa nhầm quyền sửa của admin.
 */

export type EventPhase = "draft" | "registration" | "running" | "ended";

export const PHASE_LABEL: Record<EventPhase, string> = {
  draft: "Draft",
  registration: "Registration Open",
  running: "In Competition",
  ended: "Ended",
};

const firstDefined = (obj: any, names: string[]): any => {
  if (!obj) return undefined;
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null) return obj[n];
  }
  return undefined;
};

const isTrue = (v: any) => v === true || v === "true" || v === 1 || v === "1";

/** Đọc một mốc thời gian bất kể backend viết hoa/thường kiểu gì. */
export const pickDate = (obj: any, names: string[]): Date | null => {
  const raw = firstDefined(
    obj,
    names.flatMap((n) => [n, n[0].toUpperCase() + n.slice(1)]),
  );
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

export const getRegistrationWindow = (ev: any) => ({
  start: pickDate(ev, ["registrationStartDate", "registerStartDate"]),
  end: pickDate(ev, ["registrationEndDate", "registerEndDate"]),
});

/**
 * currentRound theo quy ước 1-based: vòng đầu tiên là 1 (khớp với roundIndex mà
 * CreateEvents gửi lên). 0 / null nghĩa là chưa bước vào vòng nào.
 */
const readCurrentRound = (ev: any): number | null => {
  const raw = firstDefined(ev, ["currentRound", "CurrentRound"]);
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
};

export function getEventPhase(ev: any, totalRounds: number): EventPhase {
  if (!ev) return "draft";

  // 1. Field status tường minh — tin tưởng nhất nếu backend có trả.
  const statusRaw = firstDefined(ev, ["status", "Status", "eventStatus"]);
  const s = String(statusRaw ?? "")
    .trim()
    .toLowerCase();
  if (s) {
    if (["draft", "0", "new", "created"].includes(s)) return "draft";
    if (["published", "1", "registration", "registering", "open"].includes(s))
      return "registration";
    if (["ongoing", "2", "running", "inprogress", "in_progress"].includes(s))
      return "running";
    if (["ended", "3", "finished", "completed", "closed"].includes(s))
      return "ended";
  }

  // 2. Cờ boolean.
  if (isTrue(firstDefined(ev, ["isEnded", "IsEnded", "isFinished"])))
    return "ended";

  const r = readCurrentRound(ev);

  // 3. Suy từ currentRound. Chỉ khi đã vào vòng 1 trở đi mới coi là đang thi.
  if (r !== null) {
    if (r >= 1) return r > totalRounds && totalRounds > 0 ? "ended" : "running";
    // -1 là quy ước cũ của backend cho "đã publish, đang mở đăng ký".
    if (r === -1) return "registration";
  }

  // 4. Chưa vào vòng nào: phân biệt draft với đang mở đăng ký bằng cờ publish.
  if (
    isTrue(
      firstDefined(ev, [
        "isPublished",
        "IsPublished",
        "published",
        "isRegistrationOpen",
        "isOpenRegistration",
      ]),
    )
  )
    return "registration";

  // ⚠️ Mặc định là draft, KHÔNG phải registration. Đoán sai về phía draft thì
  // admin chỉ thấy thừa nút "Open Registration"; đoán sai về phía registration
  // thì admin mất quyền sửa sự kiện mình vừa tạo.
  return "draft";
}

/** Chỉ ở draft mới được thêm/sửa/xóa track, round, rubric, prize. */
export const canEditStructure = (phase: EventPhase) => phase === "draft";

/**
 * Chưa tới ngày mở đăng ký thì nút publish phải bị chặn: sự kiện công khai sớm
 * hơn lịch đã công bố là không quay lại được.
 */
export const canPublishNow = (ev: any, phase: EventPhase, now = new Date()) => {
  if (phase !== "draft") return false;
  const { start } = getRegistrationWindow(ev);
  return !start || now >= start;
};

export const canStartRound1 = (phase: EventPhase) => phase === "registration";

/** Đã qua hạn đăng ký mà vẫn chưa bấm Start Round 1. */
export const isRegistrationOverdue = (
  ev: any,
  phase: EventPhase,
  now = new Date(),
) => {
  if (phase !== "registration") return false;
  const { end } = getRegistrationWindow(ev);
  return !!end && now > end;
};
