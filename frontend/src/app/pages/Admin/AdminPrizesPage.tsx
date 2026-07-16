import { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Gift,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Filter,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { eventApi } from "../../lib/api/eventApi";
import { prizeApi, type PrizeData } from "../../lib/api/prizeApi";
import { roundApi } from "../../lib/api/roundApi";
import apiClient from "../../lib/api/apiClient";

const isInactiveRecord = (obj: any): boolean => {
  if (!obj) return false;
  if (obj.isDeleted === true || obj.IsDeleted === true) return true;
  if (obj.isActive === false || obj.IsActive === false) return true;
  const statusStr = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (statusStr === "deleted" || statusStr === "inactive") return true;
  return false;
};

export function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<PrizeData[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await eventApi.getAllEvents();
        setEvents(eventsData || []);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };
    fetchEvents();
  }, []);

  const fetchPrizes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let prizesData;
      if (selectedEventId) {
        prizesData = await prizeApi.getPrizesByEvent(selectedEventId);
      } else {
        prizesData = await prizeApi.getAllPrizes();
      }
      setPrizes(prizesData || []);
    } catch (err: any) {
      setError("Unable to load the Prize list. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const filteredPrizes = prizes.filter((p) =>
    p.prizeName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const activePrizes = filteredPrizes.filter((p) => !isInactiveRecord(p));
  const deletedPrizes = filteredPrizes.filter((p) => isInactiveRecord(p));

  const handleCreatePrize = async () => {
    if (events.length === 0) {
      return Swal.fire(
        "Wait a moment!",
        "There are no Events in the system. Please create an Event before creating a Prize.",
        "warning",
      );
    }

    const eventOptions = events
      .map(
        (e) =>
          `<option value="${e.id || e.eventID}">${e.name || e.eventName}</option>`,
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Create New Prize",
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Prize Name</label>
          <input id="sw-name" class="swal2-input" style="width: 100%; max-width: 100%; margin: 5px 0 20px; border-radius: 12px; font-size: 14px;" placeholder="e.g., First Prize">
          
          <label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Description / Reward</label>
          <input id="sw-desc" class="swal2-input" style="width: 100%; max-width: 100%; margin: 5px 0 20px; border-radius: 12px; font-size: 14px;" placeholder="Details about the prize...">
          
          <label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Target Event</label>
          <select id="sw-event" class="swal2-input" style="width: 100%; max-width: 100%; margin: 5px 0 10px; border-radius: 12px; font-size: 14px; cursor: pointer;">
            <option value="" disabled selected>-- Select an Event --</option>
            ${eventOptions}
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-8 py-3 bg-[#0a192f]",
        cancelButton:
          "rounded-xl font-bold px-8 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
      preConfirm: () => {
        const name = (document.getElementById("sw-name") as HTMLInputElement)
          .value;
        const desc = (document.getElementById("sw-desc") as HTMLInputElement)
          .value;
        const eventId = (
          document.getElementById("sw-event") as HTMLSelectElement
        ).value;
        if (!name || !eventId) {
          Swal.showValidationMessage(
            "Please provide a Prize Name and select an Event!",
          );
          return false;
        }
        return { prizeName: name, description: desc, eventId };
      },
    });

    if (formValues) {
      try {
        await prizeApi.createPrize(formValues);
        Swal.fire({
          icon: "success",
          title: "Created!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire(
          "Error",
          "Failed to create prize. " + (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  const handleEditPrize = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;

    const { value: formValues } = await Swal.fire({
      title: "Update Prize",
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Prize Name</label>
          <input id="sw-name" class="swal2-input" style="width: 100%; max-width: 100%; margin: 5px 0 20px; border-radius: 12px; font-size: 14px;" placeholder="Prize Name" value="${prize.prizeName || ""}">
          <label style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Description</label>
          <input id="sw-desc" class="swal2-input" style="width: 100%; max-width: 100%; margin: 5px 0 10px; border-radius: 12px; font-size: 14px;" placeholder="Description" value="${prize.description || ""}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-8 py-3 bg-[#0a192f]",
        cancelButton:
          "rounded-xl font-bold px-8 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
      preConfirm: () => {
        const name = (document.getElementById("sw-name") as HTMLInputElement)
          .value;
        const desc = (document.getElementById("sw-desc") as HTMLInputElement)
          .value;
        if (!name) {
          Swal.showValidationMessage("Prize name cannot be empty!");
          return false;
        }
        return { prizeName: name, description: desc };
      },
    });

    if (formValues) {
      try {
        await prizeApi.updatePrize(pId, formValues);
        Swal.fire({
          icon: "success",
          title: "Saved!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire(
          "Error",
          "Failed to update. " + (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  const handleDeletePrize = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;

    const result = await Swal.fire({
      title: "Delete prize?",
      text: `Are you sure you want to delete "${prize.prizeName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl font-bold px-8 py-3",
        cancelButton:
          "rounded-xl font-bold px-8 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
    });

    if (result.isConfirmed) {
      try {
        await prizeApi.deletePrize(pId);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire(
          "Error",
          "Deletion failed. " + (err.response?.data?.message || ""),
          "error",
        );
      }
    }
  };

  const handleRestorePrize = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    if (!pId) return;
    try {
      await prizeApi.restorePrize(pId);
      Swal.fire({
        icon: "success",
        title: "Restored!",
        timer: 1200,
        showConfirmButton: false,
      });
      fetchPrizes();
    } catch (err: any) {
      Swal.fire(
        "Error",
        "Restore failed. " + (err.response?.data?.message || ""),
        "error",
      );
    }
  };

  const handleManualAssign = async (prize: PrizeData) => {
    const pId = prize.id || prize.prizeId;
    const eventId = prize.eventId;

    if (!pId || !eventId) {
      return Swal.fire(
        "Error",
        "This prize is not linked to a valid event!",
        "error",
      );
    }

    try {
      Swal.fire({
        title: "Loading Teams...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const allRounds = await roundApi.getAllRounds();
      const eventRounds = allRounds.filter(
        (r: any) => String(r.eventID || r.eventId) === String(eventId),
      );

      if (eventRounds.length === 0) {
        return Swal.fire(
          "Wait",
          "The event for this prize does not have any configured rounds!",
          "warning",
        );
      }

      let allTeams: any[] = [];
      await Promise.all(
        eventRounds.map(async (r: any) => {
          const rId = r.roundID || r.roundId || r.id;
          try {
            const res = await apiClient.get(
              `/api/TeamInRound/details/round/${rId}`,
            );
            if (res.data && Array.isArray(res.data))
              allTeams = [...allTeams, ...res.data];
          } catch (error) {}
        }),
      );

      const uniqueTeamsMap = new Map();
      allTeams.forEach((t) => {
        if (t.teamId && !uniqueTeamsMap.has(t.teamId))
          uniqueTeamsMap.set(t.teamId, t);
      });
      const displayTeams = Array.from(uniqueTeamsMap.values());

      if (displayTeams.length === 0) {
        return Swal.fire(
          "Notice",
          "No eligible teams found in this event!",
          "info",
        );
      }

      const teamOptions = displayTeams
        .map((t: any) => `<option value="${t.teamId}">${t.teamName}</option>`)
        .join("");
      Swal.close();

      const { value: selectedTeamId } = await Swal.fire({
        title: "Award Prize to Team",
        html: `
          <p style="margin-bottom: 20px; font-size: 14px; color: #475569; line-height: 1.5;">
            Select a deserving team to receive:<br/><strong style="color: #0a192f; font-size: 16px;">"${prize.prizeName}"</strong>
          </p>
          <select id="sw-team" class="swal2-input" style="width: 85%; margin: 0 auto; border-radius: 12px; font-size: 14px; cursor: pointer;">
            <option value="" disabled selected>-- Click to select Team --</option>
            ${teamOptions}
          </select>
        `,
        showCancelButton: true,
        confirmButtonText: "Confirm Assignment",
        confirmButtonColor: "#059669",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "rounded-[2rem]",
          confirmButton: "rounded-xl font-bold px-6 py-3",
          cancelButton:
            "rounded-xl font-bold px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200",
        },
        preConfirm: () => {
          const selectEl = document.getElementById(
            "sw-team",
          ) as HTMLSelectElement;
          if (!selectEl.value) {
            Swal.showValidationMessage("Please select a team from the list!");
            return false;
          }
          return selectEl.value;
        },
      });

      if (selectedTeamId) {
        await prizeApi.manualAssign({ prizeId: pId, teamId: selectedTeamId });
        Swal.fire({
          icon: "success",
          title: "Successfully Awarded!",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchPrizes();
      }
    } catch (err: any) {
      Swal.fire(
        "Error",
        "An error occurred while fetching data. " +
          (err.response?.data?.message || err.message),
        "error",
      );
    }
  };

  return (
    <main className="w-full bg-[#f4f6f8] min-h-screen p-10 animate-in fade-in duration-500 font-sans selection:bg-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-4xl font-extrabold text-[#0a192f] tracking-tight flex items-center gap-3">
              <Trophy size={36} className="text-amber-500" strokeWidth={2.5} />
              Prize Management
            </h2>
            <p className="text-slate-500 font-medium mt-2 text-base">
              Create and assign awards to outstanding teams.
            </p>
          </div>
          <button
            onClick={handleCreatePrize}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#0a192f] text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus size={20} strokeWidth={2.5} /> Add Prize
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Filter size={20} />
            </div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[#0a192f] text-sm font-bold rounded-xl px-5 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 min-w-[280px] w-full cursor-pointer transition-all"
            >
              <option value="">🏆 All Events</option>
              {events.map((e) => (
                <option key={e.id || e.eventID} value={e.id || e.eventID}>
                  {e.name || e.eventName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center relative w-full sm:w-80">
            <Search size={18} className="text-slate-400 absolute left-4" />
            <input
              type="text"
              placeholder="Search prize name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl pl-12 pr-5 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-2xl flex items-center gap-3">
            <AlertCircle size={24} />
            <p className="font-bold text-sm flex-1">{error}</p>
            <button
              onClick={fetchPrizes}
              className="px-4 py-2 bg-white text-red-600 rounded-xl hover:bg-red-100 text-xs font-bold transition shadow-sm border border-red-200"
            >
              <RefreshCw size={14} className="inline mr-1" /> Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-slate-400">
            <Loader2 size={36} className="animate-spin text-[#0a192f]" />
            <p className="font-bold text-base tracking-wide">
              Loading prize database...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePrizes.length === 0 && !error ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white">
                  <Gift
                    size={56}
                    className="mx-auto text-slate-300 mb-4"
                    strokeWidth={1.5}
                  />
                  <p className="text-slate-500 font-medium text-lg">
                    {searchTerm || selectedEventId
                      ? "No prizes match your filter criteria."
                      : "No prizes have been created yet. Add one above!"}
                  </p>
                </div>
              ) : (
                activePrizes.map((prize, idx) => {
                  const eventName =
                    events.find((e) => (e.id || e.eventID) === prize.eventId)
                      ?.name || "N/A";
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col h-full"
                    >
                      {prize.teamId && (
                        <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-4 py-2 rounded-bl-2xl flex items-center gap-1.5 shadow-sm border-b border-l border-emerald-100">
                          <CheckCircle size={14} strokeWidth={2.5} /> AWARDED
                        </div>
                      )}

                      <div className="flex-1 mt-2">
                        <h3 className="font-extrabold text-2xl text-[#0a192f] mb-3 pr-20 leading-tight">
                          {prize.prizeName}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10 font-medium">
                          {prize.description || "No description provided."}
                        </p>

                        <div className="bg-slate-50/80 rounded-2xl p-4 text-xs font-bold text-slate-500 mb-6 border border-slate-100">
                          <div className="mb-1.5 truncate" title={eventName}>
                            <span className="uppercase tracking-widest text-[9px] text-slate-400 block mb-0.5">
                              Event
                            </span>
                            <span className="text-[#0a192f] text-sm">
                              {eventName}
                            </span>
                          </div>
                          {prize.teamId && (
                            <div className="mt-3">
                              <span className="uppercase tracking-widest text-[9px] text-emerald-500 block mb-0.5">
                                Recipient Team ID
                              </span>
                              <span className="text-emerald-700 text-sm font-mono">
                                {prize.teamId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-auto">
                        <button
                          onClick={() => handleManualAssign(prize)}
                          className="flex-1 bg-white text-[#0a192f] font-bold text-sm py-2.5 rounded-xl border-2 border-slate-100 hover:border-[#0a192f] hover:bg-slate-50 transition-all"
                        >
                          {prize.teamId ? "Change Recipient" : "Award Prize"}
                        </button>
                        <button
                          onClick={() => handleEditPrize(prize)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          title="Edit Prize"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePrize(prize)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Prize"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {deletedPrizes.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RotateCcw size={16} /> Deleted Prizes Archive
                </h3>
                <div className="flex flex-wrap gap-4">
                  {deletedPrizes.map((prize, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white border border-slate-200 pl-5 pr-2 py-2.5 rounded-2xl shadow-sm opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <div>
                        <p
                          className="text-sm font-bold text-slate-500 line-through max-w-[200px] truncate"
                          title={prize.prizeName}
                        >
                          {prize.prizeName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestorePrize(prize)}
                        title="Restore Prize"
                        className="p-2.5 bg-slate-100 text-emerald-600 rounded-xl hover:bg-emerald-100 transition shrink-0"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
