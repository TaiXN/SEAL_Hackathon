// ==========================================================================
// HÀM DÙNG CHUNG — chuẩn hóa dữ liệu Tiêu chí / Bộ tiêu chí (Criteria / Set)
// Backend đặt tên field không nhất quán (criteriaID / criteriaId / CriteriaId,
// setId / SetId / criteriaSetID...) nên các hàm dưới đây dò theo nhiều khả năng
// để UI không vỡ khi field đổi tên. Dùng chung cho CreateEvents & EventDetailsPage.
// ==========================================================================

export interface CriteriaItemView {
  criteriaId: string | null;
  name: string;
  description: string;
  score: number;
}

/** Ép một response bất kỳ (mảng trần, {data:[]}, {items:[]}, {result:[]}) về mảng an toàn */
export const getList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

/** Dò tìm ID bất chấp Backend đặt tên biến là gì (Event/Track/Topic/Criteria/Set) */
export const extractId = (obj: any): string | null => {
  if (!obj) return null;
  return (
    obj.id ||
    obj.trackId ||
    obj.trackID ||
    obj.topicId ||
    obj.topicID ||
    obj.criteriaId ||
    obj.CriteriaId ||
    obj.criteriaID ||
    obj.setID ||
    obj.setId ||
    obj.criteriaSetId ||
    obj.criteriaSetID ||
    // ⚠️ Khóa ngoại để CUỐI cùng — nếu không sẽ che mất ID thật của object gốc
    obj.eventId ||
    obj.eventID ||
    null
  );
};

/** Lấy CHÍNH XÁC trackId của một track object (không bao giờ nhầm sang eventId) */
export const pickTrackId = (obj: any): string | null => {
  if (!obj) return null;
  return obj.trackId || obj.trackID || obj.id || null;
};

const looksLikeGuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Lấy CHÍNH XÁC setId của một criteria-set object (quét GUID làm phương án cuối) */
export const grabSetId = (s: any): string | null => {
  if (!s) return null;
  const direct =
    s.setID || s.setId || s.criteriaSetId || s.criteriaSetID || s.id;
  if (direct) return direct;
  for (const k of Object.keys(s)) {
    if (k.toLowerCase().includes("event")) continue;
    if (looksLikeGuid(s[k])) return s[k];
  }
  return null;
};

/**
 * Đọc danh sách tiêu chí (criteriaList) bên trong MỘT bộ tiêu chí.
 * ⚠️ Một số endpoint bọc dữ liệu trong { data: {...} }, và tên field mảng có
 * thể là criteriaList / CriteriaList / criteriaMappingItemViewModels... nên
 * phải dò nhiều khả năng + quét toàn bộ key làm phương án cuối.
 */
export const extractSetList = (setData: any): any[] => {
  const s = setData?.data || setData || {};
  if (Array.isArray(s)) return s;
  if (Array.isArray(s.criteriaList)) return s.criteriaList;
  if (Array.isArray(s.CriteriaList)) return s.CriteriaList;
  if (Array.isArray(s.criteriaMappingItemViewModels))
    return s.criteriaMappingItemViewModels;
  for (const k in s) if (Array.isArray(s[k])) return s[k];
  return [];
};

export const itemCriteriaId = (it: any): string | null =>
  it.criteriaId ||
  it.criteriaID ||
  it.CriteriaId ||
  it.CriteriaID ||
  it.id ||
  null;

export const itemScore = (it: any): number =>
  Number(it.score ?? it.Score ?? it.weight ?? it.Weight ?? 0);

/**
 * Chuẩn hóa list để gửi lên updateSet (dùng cho EventDetailsPage.tsx).
 * ⚠️ CHỈ gửi chữ thường (criteriaId/score) — đây là format gốc mà endpoint
 * PUT /Criteria/set/{id} chấp nhận. KHÔNG thêm bản PascalCase (CriteriaId/Score)
 * song song — backend trả lỗi 400 "Error occurred during the set update
 * process" khi nhận cả 2 cách viết trùng nhau trong cùng object.
 */
export const toPayloadList = (items: any[]) =>
  items.map((it: any) => ({
    criteriaId: it.criteriaId ?? itemCriteriaId(it),
    score: Number(it.score ?? itemScore(it)),
  }));

/** Lấy đúng câu báo lỗi backend trả về (thay vì câu chung chung) */
export const getServerMsg = (e: any): string => {
  const data = e?.response?.data;
  const errorsObj = data?.errors;
  const errorsText =
    errorsObj && typeof errorsObj === "object"
      ? Object.entries(errorsObj)
          .map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
          )
          .join(" | ")
      : "";
  return (
    data?.message ||
    data?.detail || // ASP.NET Core ProblemDetails hay dùng field này để chứa lý do thật
    errorsText ||
    data?.title ||
    (typeof data === "string" ? data : "") ||
    e?.message ||
    "Không rõ nguyên nhân"
  );
};

/** Mô tả mặc định khi người dùng để trống ô mô tả tiêu chí */
export const DEFAULT_CRITERIA_DESCRIPTION = "Tiêu chí Hackathon";

/** Tổng trọng số của một danh sách tiêu chí (chấp nhận cả field weight lẫn score) */
export const sumWeight = (
  items: { weight?: number; score?: number }[],
): number =>
  items.reduce(
    (s, it) => s + Number((it as any).weight ?? (it as any).score ?? 0),
    0,
  );

export const isFullWeight = (
  items: { weight?: number; score?: number }[],
): boolean => sumWeight(items) === 100;

/**
 * Nạp CHI TIẾT đầy đủ (kèm criteriaList bên trong) cho một danh sách bộ tiêu chí.
 * ⚠️ Endpoint danh sách rút gọn (getAllSet) thường KHÔNG trả kèm chi tiết tiêu chí
 * bên trong từng bộ — phải gọi chi tiết từng bộ (getSetById) mới ra đúng dữ liệu.
 * Đây là hàm dùng chung để tránh lặp lại logic ở nhiều nơi.
 */
export async function loadSetsWithItems(
  baseSets: { setId: string; setName: string; isDefault?: boolean }[],
  critMap: Record<string, { name: string; description: string }>,
  getSetById: (setId: string) => Promise<any>,
): Promise<
  Array<{
    setId: string;
    setName: string;
    isDefault?: boolean;
    items: CriteriaItemView[];
  }>
> {
  return Promise.all(
    baseSets.map(async (s) => {
      try {
        const detail = await getSetById(s.setId);
        const rawList = extractSetList(detail);
        const items: CriteriaItemView[] = rawList.map((it: any) => {
          const cid = itemCriteriaId(it);
          const info = cid ? critMap[String(cid)] : undefined;
          return {
            criteriaId: cid,
            name: info?.name || it.criteriaName || it.name || "(?)",
            description: info?.description || it.description || "",
            score: itemScore(it),
          };
        });
        return { ...s, items };
      } catch (e) {
        console.warn("Không tải được chi tiết bộ tiêu chí:", s.setId, e);
        return { ...s, items: [] };
      }
    }),
  );
}

/** Xây map criteriaId -> { name, description } từ kết quả getAllCriteria() */
export function buildCriteriaMap(
  critRaw: any,
): Record<string, { name: string; description: string }> {
  const map: Record<string, { name: string; description: string }> = {};
  getList(critRaw).forEach((c: any) => {
    const cid = c.criteriaID || c.criteriaId || c.id;
    if (cid) {
      map[String(cid)] = {
        name: c.criteriaName || c.name || "(?)",
        description: c.description || "",
      };
    }
  });
  return map;
}
