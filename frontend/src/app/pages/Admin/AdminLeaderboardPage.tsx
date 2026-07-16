import { useState, useEffect } from "react";
import { BarChart2, Filter, Loader2, Medal, Trophy } from "lucide-react";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";
import { trackTopicApi } from "../../lib/api/trackTopicApi";
import { leaderboardApi } from "../../lib/api/leaderboardApi";

export function AdminLeaderboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Lấy danh sách sự kiện ban đầu
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventApi.getAllEvents();
        setEvents(res || []);
      } catch (err) {
        console.error("Lỗi tải sự kiện", err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Khi chọn Sự kiện -> Load Vòng thi & Hạng mục của sự kiện đó
  useEffect(() => {
    if (!selectedEventId) return;
    const fetchDetails = async () => {
      try {
        const [allRounds, allTracks] = await Promise.all([
          roundApi.getAllRounds(),
          trackTopicApi.getAllTracks(),
        ]);

        const filteredRounds = allRounds.filter(
          (r: any) => String(r.eventId || r.eventID) === selectedEventId,
        );
        const filteredTracks = allTracks.filter(
          (t: any) => String(t.eventId || t.eventID) === selectedEventId,
        );

        setRounds(filteredRounds);
        setTracks(filteredTracks);

        // Reset lựa chọn bên dưới
        setSelectedRoundId("");
        setSelectedTrackId("");
        setLeaderboardData([]);
      } catch (error) {
        console.error("Lỗi tải chi tiết", error);
      }
    };
    fetchDetails();
  }, [selectedEventId]);

  // 3. Khi Admin đã chọn đủ Vòng và Hạng mục -> Gọi API Leaderboard
  useEffect(() => {
    if (!selectedRoundId || !selectedTrackId) return;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await leaderboardApi.getLeaderboardByRoundAndTrack(
          selectedRoundId,
          selectedTrackId,
        );
        // Giả sử backend trả về mảng, xếp giảm dần theo điểm
        setLeaderboardData(data || []);
      } catch (error: any) {
        Swal.fire("Lỗi", "Không thể lấy bảng xếp hạng!", "error");
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedRoundId, selectedTrackId]);

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart2 size={32} className="text-blue-500" />
            Bảng Xếp Hạng Đội Thi
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Xem điểm số và thứ hạng của các đội theo từng ngách.
          </p>
        </div>

        {/* BỘ LỌC */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              1. Chọn Sự Kiện
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-4 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                -- Chọn Sự Kiện --
              </option>
              {events.map((e) => {
                // Bọc lót đủ kiểu case-sensitive
                const eId = e.eventID || e.eventId || e.id;
                return (
                  <option key={eId} value={eId}>
                    {e.name || e.eventName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              2. Chọn Vòng Thi
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              disabled={!selectedEventId}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="" disabled>
                -- Chọn Vòng Thi --
              </option>
              {rounds.map((r) => {
                // Bọc lót đủ kiểu case-sensitive để không bị rớt chữ
                const rId = r.roundID || r.roundId || r.id;
                return (
                  <option key={rId} value={rId}>
                    {r.roundName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              3. Chọn Hạng Mục
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              disabled={!selectedRoundId}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="" disabled>
                -- Chọn Hạng Mục --
              </option>
              {tracks.map((t) => {
                // Bọc lót đủ kiểu case-sensitive
                const tId = t.trackID || t.trackId || t.id;
                return (
                  <option key={tId} value={tId}>
                    {t.trackName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* KẾT QUẢ BẢNG XẾP HẠNG SẼ NẰM Ở ĐÂY */}
        {/* KẾT QUẢ BẢNG XẾP HẠNG SẼ NẰM Ở ĐÂY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 my-20">
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <p className="font-bold">Đang tính toán điểm số...</p>
            </div>
          ) : !selectedRoundId || !selectedTrackId ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20">
              <Filter size={48} className="mb-4 opacity-30" />
              <p className="font-medium text-slate-500">
                Vui lòng chọn đầy đủ Sự Kiện, Vòng thi và Hạng mục để xem bảng
                điểm.
              </p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 my-20 bg-slate-50 mx-6 rounded-xl border-2 border-dashed border-slate-200">
              <Medal size={48} className="mb-3 text-slate-300" />
              <p className="font-bold text-slate-500">
                Chưa có đội nào được chấm điểm ở Hạng mục này!
              </p>
              <p className="text-sm mt-1">
                Vui lòng đợi Giám khảo hoàn tất việc chấm thi.
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Header của Bảng */}
              <div className="grid grid-cols-12 gap-4 bg-slate-900 text-white px-6 py-4 text-sm font-bold uppercase tracking-wider">
                <div className="col-span-2 text-center">Xếp hạng</div>
                <div className="col-span-7">Đội thi</div>
                <div className="col-span-3 text-center">Tổng điểm</div>
              </div>

              {/* Danh sách các đội thi */}
              <div className="divide-y divide-slate-100">
                {/* Sắp xếp data theo điểm từ cao xuống thấp cho chắc cú */}
                {[...leaderboardData]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((team, index) => {
                    // Style cho Top 1, 2, 3
                    let rankIcon = null;
                    let rowClass = "hover:bg-slate-50 transition-colors";
                    let rankTextClass = "text-slate-500 font-bold";

                    if (index === 0) {
                      rankIcon = (
                        <Trophy
                          size={24}
                          className="text-amber-400 drop-shadow-md"
                        />
                      );
                      rowClass =
                        "bg-amber-50/30 hover:bg-amber-50 transition-colors";
                      rankTextClass = "text-amber-600 font-black text-lg";
                    } else if (index === 1) {
                      rankIcon = (
                        <Medal
                          size={24}
                          className="text-slate-400 drop-shadow-sm"
                        />
                      );
                      rowClass =
                        "bg-slate-50/50 hover:bg-slate-100 transition-colors";
                      rankTextClass = "text-slate-500 font-black text-lg";
                    } else if (index === 2) {
                      rankIcon = (
                        <Medal
                          size={24}
                          className="text-amber-700 drop-shadow-sm opacity-80"
                        />
                      );
                      rowClass =
                        "bg-orange-50/30 hover:bg-orange-50 transition-colors";
                      rankTextClass = "text-amber-800 font-black text-lg";
                    }

                    return (
                      <div
                        key={team.teamInRoundId || index}
                        className={`grid grid-cols-12 gap-4 px-6 py-5 items-center ${rowClass}`}
                      >
                        {/* CỘT 1: Hạng */}
                        <div className="col-span-2 flex justify-center items-center">
                          {rankIcon ? (
                            <div className="flex flex-col items-center justify-center">
                              {rankIcon}
                              <span
                                className={`text-[10px] mt-1 ${rankTextClass}`}
                              >
                                TOP {index + 1}
                              </span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* CỘT 2: Tên đội */}
                        <div className="col-span-7">
                          <p className="font-bold text-slate-800 text-base">
                            {team.teamName || "Đội Ẩn Danh"}
                          </p>
                          {/* Hiện cái ID nhỏ nhỏ cho Admin dễ tra soát nếu cần */}
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            ID: {team.teamInRoundId}
                          </p>
                        </div>

                        {/* CỘT 3: Điểm số */}
                        <div className="col-span-3 flex justify-center">
                          <div
                            className="px-4 py-1.5 rounded-xl font-black text-lg flex items-center gap-1 min-w-[80px] justify-center shadow-sm border
                          ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200'}"
                            style={
                              index === 0
                                ? {
                                    background:
                                      "linear-gradient(to right, #fbbf24, #f59e0b)",
                                    color: "white",
                                    borderColor: "#f59e0b",
                                  }
                                : {}
                            }
                          >
                            {Number(team.score || 0).toFixed(2)}{" "}
                            <span
                              className={`text-xs ${index === 0 ? "text-amber-100" : "text-slate-400"}`}
                            >
                              pt
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
