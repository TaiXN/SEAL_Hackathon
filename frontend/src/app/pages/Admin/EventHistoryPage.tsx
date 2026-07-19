import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Calendar, Hexagon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { roundApi } from "../../lib/api/roundApi";

export function EventHistoryPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [seasonFilter, setSeasonFilter] = useState("All");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const [data, allRounds] = await Promise.all([
        eventApi.getAllEvents(),
        roundApi.getAllRounds().catch(() => []),
      ]);

      const enrichedData = data.map((e: any) => {
        const evRounds = allRounds.filter(
          (r: any) => String(r.eventId || r.eventID) === String(e.id),
        );
        return {
          ...e,
          maxRounds: evRounds.length > 0 ? evRounds.length : 2,
        };
      });

      setEvents(enrichedData);
    } catch (error) {
      Swal.fire("Error", "Failed to load event list from server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC LỌC VÀ SẮP XẾP SỰ KIỆN THEO BẢNG CHỮ CÁI ---
  const filteredEvents = events
    .filter((ev) => {
      // Lọc theo tên
      const matchSearch = (ev.name || ev.eventName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Lọc theo trạng thái
      const evStatus =
        ev.currentRound >= (ev.maxRounds || 2) ? "Ended" : "Ongoing";
      const matchStatus = statusFilter === "All" || evStatus === statusFilter;

      // Lọc theo Season
      const matchSeason =
        seasonFilter === "All" || ev.semester === seasonFilter;

      return matchSearch && matchStatus && matchSeason;
    })
    .sort((a, b) => {
      // Sắp xếp A-Z theo tên sự kiện
      const nameA = a.name || a.eventName || "";
      const nameB = b.name || b.eventName || "";
      return nameA.localeCompare(nameB);
    });

  const handleDeleteEvent = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Delete Event?",
      html: `Are you sure you want to permanently delete <b>${name}</b>?<br/>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-6 py-2.5",
        cancelButton:
          "rounded-xl font-bold px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200",
      },
    });

    if (result.isConfirmed) {
      try {
        await eventApi.deleteEvent(id);
        Swal.fire({
          title: "Deleted!",
          text: "The event has been successfully removed.",
          icon: "success",
          confirmButtonColor: "#0a192f",
          customClass: { confirmButton: "rounded-xl font-bold px-6 py-2.5" },
        });
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== id),
        );
      } catch (error) {
        Swal.fire(
          "Error",
          "Deletion failed. Please check your connection or permissions.",
          "error",
        );
      }
    }
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-[#0a192f] tracking-tight flex items-center gap-3">
              <Calendar size={36} className="text-blue-600" strokeWidth={2.5} />
              Event Archive
            </h2>
            <p className="text-slate-500 text-base font-medium mt-2">
              Manage all past, ongoing, and upcoming tournaments in the system.
            </p>
          </div>

          <button
            onClick={() => navigate("create")}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#0a192f] text-white text-sm font-black rounded-2xl border-2 border-[#0a192f] border-b-[6px] hover:bg-slate-800 hover:border-b-black active:border-b-[2px] active:translate-y-[4px] transition-all"
          >
            <Plus size={20} strokeWidth={3} /> Initialize Event
          </button>
        </div>

        {/* THANH CÔNG CỤ SEARCH & FILTER (MỚI THÊM) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-bold rounded-xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Ended">Ended</option>
            </select>

            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-bold rounded-xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all appearance-none"
            >
              <option value="All">All Seasons</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          <div className="flex items-center w-full sm:w-80">
            <input
              type="text"
              placeholder="Search event name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold text-[#0a192f] rounded-xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden p-3">
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[11px] font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 w-2/5">Tournament Name</th>
                  <th className="px-6 py-5">Season</th>
                  <th className="px-6 py-5 text-center">Year</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-sm"
                    >
                      <Hexagon className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0a192f]" />
                      Loading Archive...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-500 font-medium text-base"
                    >
                      No events found in the database.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event, index) => (
                    <tr
                      key={event.id ?? index}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <span className="font-black text-[#0a192f] text-lg group-hover:text-blue-600 transition-colors">
                          {event.name || event.eventName}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-bold text-sm uppercase tracking-wider">
                        {event.semester || "-"}
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-bold text-sm text-center">
                        {event.year}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {event.currentRound >= 0 &&
                          event.currentRound < (event.maxRounds || 2) && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                              Ongoing
                            </span>
                          )}
                        {event.currentRound >= (event.maxRounds || 2) && (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            Ended
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 text-[#0a192f] bg-slate-100 border border-slate-200 hover:bg-[#0a192f] hover:text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                          <Eye size={16} strokeWidth={2.5} /> Manage
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEvent(
                              event.id,
                              event.name || event.eventName,
                            )
                          }
                          className="text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 transition-colors p-2 rounded-xl hover:bg-red-50"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
