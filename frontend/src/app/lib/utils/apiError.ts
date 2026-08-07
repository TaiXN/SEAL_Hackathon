// ==========================================================================
// THÔNG BÁO LỖI CHO NGƯỜI DÙNG CUỐI
//
// Nguyên tắc: người dùng chỉ được thấy MỘT câu dễ hiểu + việc cần làm tiếp.
// Payload, stack trace, tên field của backend... chỉ đi vào Console cho dev.
//
// Backend của dự án hay trả về câu chung chung ("Update failed. Please ensure
// the provided data is valid.") hoặc body rỗng, nên phần lớn thông tin hữu ích
// nằm ở HTTP status — bảng ánh xạ bên dưới dựa vào đó là chính.
// ==========================================================================

import Swal from "sweetalert2";

const BRAND = "#f26f21";

export interface FriendlyError {
  title: string;
  text: string;
}

/** Lấy câu thông báo thô mà backend trả về (chưa lọc) */
const rawServerMessage = (e: any): string => {
  const data = e?.response?.data;
  if (typeof data === "string") return data.trim();
  const errorsObj = data?.errors;
  const errorsText =
    errorsObj && typeof errorsObj === "object"
      ? Object.values(errorsObj)
          .map((msgs) => (Array.isArray(msgs) ? msgs.join(", ") : String(msgs)))
          .join(" ")
      : "";
  return String(
    data?.message || data?.detail || errorsText || data?.title || "",
  ).trim();
};

/**
 * Câu backend trả về có ĐỦ TỬ TẾ để đưa thẳng cho người dùng không.
 *
 * ⚠️ Lọc kỹ: nếu lỡ để lọt stack trace / HTML / JSON thì đúng cái "đống đỏ lè"
 * mà ta đang muốn dẹp sẽ quay lại, chỉ khác là nằm trong ô text.
 */
const isPresentable = (msg: string): boolean => {
  if (!msg || msg.length < 4 || msg.length > 200) return false;
  if (/^[[{<]/.test(msg)) return false; // JSON hoặc HTML
  if (/request failed with status code/i.test(msg)) return false;
  if (/network error|timeout of \d+ms/i.test(msg)) return false;
  if (
    /exception|stack ?trace|traceback|at [A-Z][\w.]*\(|System\.|Microsoft\.|SqlException|inner error|object reference/i.test(
      msg,
    )
  )
    return false;
  return true;
};

const join = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/** "save the rubric set" -> "Couldn't save the rubric set" */
const titleFor = (action: string | undefined, fallback: string) =>
  action ? `Couldn't ${action}` : fallback;

export interface FriendlyErrorOptions {
  /** Việc người dùng vừa cố làm, viết ở dạng động từ: "save the rubric set" */
  action?: string;
  /** Gợi ý riêng cho tình huống này, thay cho câu hướng dẫn mặc định */
  hint?: string;
}

/**
 * Chuyển một lỗi API bất kỳ thành cặp { title, text } đọc được.
 * Không bao giờ ném lỗi, luôn trả về một thông báo dùng được.
 */
export function friendlyError(
  error: any,
  opts: FriendlyErrorOptions = {},
): FriendlyError {
  const { action, hint } = opts;
  const status: number | undefined = error?.response?.status;
  const raw = rawServerMessage(error);
  const detail = isPresentable(raw) ? raw : "";

  // Không có response = request không tới được server (mất mạng, CORS, server sập)
  if (!error?.response) {
    return {
      title: "Can't reach the server",
      text: join(
        "The request didn't get through.",
        hint || "Check your internet connection and try again in a moment.",
      ),
    };
  }

  if (status === 400 || status === 422) {
    return {
      title: titleFor(action, "Invalid information"),
      text: join(
        detail || "Some of the information sent isn't valid.",
        hint || "Please review what you entered and try again.",
      ),
    };
  }

  if (status === 401) {
    return {
      title: "Your session has expired",
      text: "Please sign in again to continue.",
    };
  }

  if (status === 403) {
    return {
      title: "You don't have permission",
      text: join(
        detail || "Your account isn't allowed to perform this action.",
        hint,
      ),
    };
  }

  if (status === 404) {
    return {
      title: titleFor(action, "Not found"),
      text: join(
        detail || "This item no longer exists — someone may have deleted it.",
        hint || "Refresh the page to see the latest data.",
      ),
    };
  }

  if (status === 409) {
    return {
      title: titleFor(action, "Conflicts with existing data"),
      text: join(
        detail || "Something with the same details already exists.",
        hint || "Change the conflicting value and try again.",
      ),
    };
  }

  if (status === 413) {
    return {
      title: "File is too large",
      text: join(detail || "The server rejected the upload because of its size.", hint),
    };
  }

  if (status === 429) {
    return {
      title: "Too many requests",
      text: "Please wait a moment before trying again.",
    };
  }

  if (status !== undefined && status >= 500) {
    return {
      title: "The server ran into a problem",
      text: join(
        "This isn't something you did wrong.",
        hint || "Please try again in a moment, and tell an admin if it keeps happening.",
      ),
    };
  }

  return {
    title: titleFor(action, "Something went wrong"),
    text: join(detail || "The action could not be completed.", hint),
  };
}

/**
 * Một câu duy nhất cho các banner lỗi hiển thị ngay trong trang (không phải popup).
 */
export function friendlyErrorText(
  error: any,
  opts: FriendlyErrorOptions = {},
): string {
  const { title, text } = friendlyError(error, opts);
  console.error(`[${title}]`, technicalDetails(error), error);
  return `${title}. ${text}`;
}

/**
 * Mô tả ĐẦY ĐỦ một lỗi API để dev dán cho bên Backend — CHỈ dùng cho Console.
 *
 * ⚠️ Backend hay trả 400 kèm câu chung chung hoặc body rỗng; lúc đó axios chỉ
 * đưa ra "Request failed with status code 400", không đủ để sửa. Nên phải in
 * kèm: endpoint đã gọi, status, payload ĐÃ GỬI và body thô backend trả về.
 * Payload gửi đi thường mới là thứ tố cáo field nào sai.
 */
export function technicalDetails(error: any): string {
  const res = error?.response;
  if (!res) return String(error?.message || error);

  const cfg = error.config || {};
  const endpoint =
    `${String(cfg.method || "").toUpperCase()} ${cfg.baseURL || ""}${cfg.url || ""}`.trim();

  const stringify = (v: any) => {
    if (v === undefined || v === null || v === "") return "(empty)";
    if (typeof v === "string") {
      try {
        return JSON.stringify(JSON.parse(v), null, 2);
      } catch {
        return v;
      }
    }
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  return [
    `${endpoint} → ${res.status} ${res.statusText || ""}`.trim(),
    "── Request payload ──",
    stringify(cfg.data),
    "── Response body ──",
    stringify(res.data),
  ].join("\n");
}

/**
 * Hiện popup lỗi thống nhất cho toàn app + ghi chi tiết kỹ thuật ra Console.
 * Dùng hàm này thay cho Swal.fire("Error", <chuỗi thô>, "error").
 */
export function showApiError(error: any, opts: FriendlyErrorOptions = {}) {
  const { title, text } = friendlyError(error, opts);
  console.error(`[${title}]`, technicalDetails(error), error);
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: BRAND,
    customClass: {
      popup: "rounded-[2rem]",
      confirmButton: "rounded-xl font-bold px-6 py-2.5",
    },
  });
}
