import { useState, useEffect } from "react";
import { BarChart2, Filter, Loader2 } from "lucide-react";
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 mt-20">
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <p className="font-bold">Đang tính toán điểm số...</p>
            </div>
          ) : !selectedRoundId || !selectedTrackId ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20">
              <Filter size={48} className="mb-4 opacity-50" />
              <p className="font-medium">
                Vui lòng chọn đầy đủ Vòng thi và Hạng mục để xem bảng điểm.
              </p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20">
              <p className="font-medium">
                Chưa có dữ liệu điểm số cho hạng mục này.
              </p>
            </div>
          ) : (
            <div className="text-center font-bold text-slate-700 mt-10">
              {/* Tạm thời render ra chuỗi JSON để xem cấu trúc data Backend trả về */}
              <p className="mb-4 text-emerald-600">
                Đã gọi API thành công! Đây là dữ liệu thô:
              </p>
              <pre className="text-left bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(leaderboardData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
