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
 *   running       Form đăng ký đã đóng, các đội bắt đầu nộp bài. Xảy ra khi admin
 *                 bấm "Start Round 1" (PUT /api/Event/{id}/start-round-1), hoặc
 *                 tự động khi tới registrationEndDate.
 *   ended         Đã qua vòng cuối. Chỉ còn xem và trao giải.
 *
 * ⚠️ QUY ƯỚC currentRound CỦA BACKEND — đây là field DUY NHẤT cho biết sự kiện
 * đang ở giai đoạn nào, đừng suy diễn từ thứ khác:
 *
 *      -1  draft (vừa tạo, chưa publish)
 *       0  đã publish, form đăng ký đang mở
 *      >=1 đang thi, số chính là vòng hiện tại (vòng đầu tiên là 1)
 *
 * Trước đây -1 bị map nhầm thành "registration", nên mọi sự kiện vừa tạo đều
 * hiện ra như đang mở đăng ký: mất banner draft, mất nút Publish, và admin bị
 * khóa quyền sửa chính sự kiện mình vừa tạo.
 *
 * ⚠️ "Field DUY NHẤT" ở trên là nói thật, không phải nói cho vui: currentRound
 * phải được xét TRƯỚC field `status`. Xem chú thích trong getEventPhase.
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

/**
 * Backend không thống nhất tên hai mốc đăng ký giữa các endpoint, nên dò rộng.
 * Thiếu là ô "Registration opens/closes" ở tab Overview hiện trống dù admin đã
 * nhập từ lúc tạo sự kiện.
 */
export const getRegistrationWindow = (ev: any) => ({
  start: pickDate(ev, [
    "registrationStartDate",
    "registerStartDate",
    "registrationStart",
    "regStartDate",
    "startRegistrationDate",
    "registrationOpenDate",
  ]),
  end: pickDate(ev, [
    "registrationEndDate",
    "registerEndDate",
    "registrationEnd",
    "regEndDate",
    "endRegistrationDate",
    "registrationCloseDate",
  ]),
});

/**
 * currentRound theo quy ước 1-based: vòng đầu tiên là 1 (khớp với roundIndex mà
 * CreateEvents gửi lên). Xem bảng quy ước -1 / 0 / >=1 ở đầu file.
 */
const readCurrentRound = (ev: any): number | null => {
  const raw = firstDefined(ev, ["currentRound", "CurrentRound"]);
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
};

export function getEventPhase(ev: any, totalRounds: number): EventPhase {
  if (!ev) return "draft";

  // 1. Cờ kết thúc tường minh — thắng tất cả.
  if (isTrue(firstDefined(ev, ["isEnded", "IsEnded", "isFinished"])))
    return "ended";

  const r = readCurrentRound(ev);

  // 2. currentRound — nguồn chính thức, xem bảng quy ước ở đầu file.
  //
  // ⚠️ Khối này PHẢI đứng trước khối `status` bên dưới. Trước đây `status` được
  // xét trước, mà backend lại dùng `status` cho một thứ khác hẳn giai đoạn
  // (kiểu 1 = đang hoạt động). Chuỗi "1" nằm trong danh sách "đã publish" nên
  // sự kiện vừa tạo bị chốt luôn là "registration" ngay ở bước 1, currentRound
  // không bao giờ được đọc tới — sửa quy ước -1/0 ở dưới bao nhiêu cũng vô ích.
  if (r !== null) {
    if (r <= -1) return "draft";
    if (r === 0) return "registration";
    return r > totalRounds && totalRounds > 0 ? "ended" : "running";
  }

  // 3. Không có currentRound: mới xét tới status, và CHỈ nhận giá trị dạng chữ.
  // Mã số trần ("0"/"1"/"2") bị loại vì không phân biệt được với cờ isActive.
  const statusRaw = firstDefined(ev, ["status", "Status", "eventStatus"]);
  const s = String(statusRaw ?? "")
    .trim()
    .toLowerCase();
  if (s) {
    if (["draft", "new", "created"].includes(s)) return "draft";
    if (["published", "registration", "registering", "open"].includes(s))
      return "registration";
    if (["ongoing", "running", "inprogress", "in_progress"].includes(s))
      return "running";
    if (["ended", "finished", "completed", "closed"].includes(s))
      return "ended";
  }

  // 4. Cuối cùng: dò cờ publish.
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
 * Đang draft là bấm publish được — thời điểm công khai do admin quyết định.
 *
 * ⚠️ Trước đây hàm này còn chặn thêm điều kiện `now >= registrationStartDate`.
 * Nhưng draft đúng nghĩa là khoảng thời gian TRƯỚC ngày mở đăng ký (tạo ngày 7,
 * hẹn mở form ngày 10 thì 7→10 là draft), nên điều kiện đó vô hiệu hóa nút
 * publish đúng vào lúc nó cần có mặt nhất. Bấm sớm chỉ cần cảnh báo, xem
 * isPublishingEarly bên dưới.
 */
export const canPublish = (phase: EventPhase) => phase === "draft";

/** Bấm publish trước ngày mở đăng ký đã công bố — cho phép, nhưng phải hỏi lại. */
export const isPublishingEarly = (ev: any, now = new Date()) => {
  const { start } = getRegistrationWindow(ev);
  return !!start && now < start;
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
