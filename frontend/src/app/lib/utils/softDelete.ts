/**
 * Backend xóa mềm: DELETE trả 200 và bản ghi hết sửa được, nhưng các endpoint
 * GET danh sách VẪN trả bản ghi đó về, chỉ kèm cờ đã xóa (`isActive: false`
 * hoặc `isDeleted: true`). Bằng chứng rõ nhất là Prize — có hẳn endpoint khôi
 * phục `PUT /api/Prize/{id}/reactive` và màn AdminPrizesPage dựa vào cờ này để
 * dựng khu "đã xóa" kèm nút Restore.
 *
 * Nên MỌI chỗ đổ danh sách ra UI đều phải tự lọc; quên lọc là bản ghi đã xóa
 * hiện lại nguyên vẹn sau khi reload trang.
 *
 * Track/Topic không dính lỗi này vì đã lọc sẵn từ đầu — dùng chúng làm mẫu.
 */
export const isInactiveRecord = (obj: any): boolean => {
  if (!obj) return false;
  if (
    obj.isDeleted === true ||
    obj.IsDeleted === true ||
    obj.deleted === true ||
    obj.Deleted === true
  )
    return true;
  if (
    obj.isActive === false ||
    obj.IsActive === false ||
    obj.status === false ||
    obj.Status === false
  )
    return true;
  const statusStr = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (statusStr === "deleted" || statusStr === "inactive") return true;
  return false;
};

/** Giữ lại các bản ghi còn sống. */
export const keepActive = <T,>(list: T[] | null | undefined): T[] =>
  (list || []).filter((item) => !isInactiveRecord(item));

/**
 * So khớp id không phân biệt hoa/thường: GUID backend trả về lúc hoa lúc thường
 * tùy endpoint, khớp nguyên văn thì lọc nhầm sạch dữ liệu.
 */
export const sameRecordId = (a: any, b: any): boolean =>
  String(a ?? "")
    .trim()
    .toLowerCase() ===
  String(b ?? "")
    .trim()
    .toLowerCase();
