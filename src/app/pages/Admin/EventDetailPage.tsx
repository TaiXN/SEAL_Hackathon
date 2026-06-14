import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { adminApi, pickId } from "../../lib/api/adminApi";

const tabs = [
  { id: 1, name: "1. Thông tin chung" },
  { id: 2, name: "2. Cơ cấu Giải thưởng" },
  { id: 3, name: "3. Vòng thi & Chia bảng" },
  { id: 4, name: "4. Hạng mục & Mentor" },
  { id: 5, name: "5. Rubric Chấm điểm" },
];

function normalizeList(value: any): any[] {
  const data = value?.data ?? value;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function getField(obj: any, keys: string[], fallback = "Chưa có dữ liệu") {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
      return obj[key];
    }
  }

  return fallback;
}

function sameId(a: any, b: any) {
  return String(a || "") === String(b || "");
}

function formatDate(value: any) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getEventName(event: any) {
  return getField(event, ["eventName", "name"], "Không có tên sự kiện");
}

function getSemester(event: any) {
  const season = getField(event, ["season"], "");
  const year = getField(event, ["year"], "");

  if (season && year) return `${season} ${year}`;

  return getField(event, ["semester", "term"], "Không rõ học kỳ");
}

function getRoundId(round: any) {
  return (
    pickId(round) ||
    round?.roundID ||
    round?.roundId ||
    `${round?.roundIndex || ""}-${round?.roundName || ""}`
  );
}

function getTrackId(track: any) {
  return pickId(track) || track?.trackID || track?.trackId;
}

function getTopicTrackId(topic: any) {
  return topic?.trackID || topic?.trackId || topic?.track?.trackID;
}

function getRoundCriteriaSetId(round: any) {
  return (
    round?.criteriaSetID ||
    round?.criteriaSetId ||
    round?.criteriaSet?.criteriaSetID ||
    round?.criteriaSet?.id
  );
}

function normalizeCriteriaList(criteriaSetDetail: any) {
  const data = criteriaSetDetail?.data ?? criteriaSetDetail;

  const rawList =
    data?.criteriaList ||
    data?.criteria ||
    data?.criterias ||
    data?.mappings ||
    data?.mapping ||
    [];

  return normalizeList(rawList).map((item: any, index: number) => {
    const criteriaObj = item?.criteria || item?.criterion || item;

    const criteriaId =
      item?.criteriaId ||
      item?.criteriaID ||
      criteriaObj?.criteriaId ||
      criteriaObj?.criteriaID ||
      pickId(criteriaObj);

    return {
      id: criteriaId || index,
      name:
        criteriaObj?.criteriaName ||
        criteriaObj?.name ||
        item?.criteriaName ||
        item?.name ||
        `Tiêu chí ${index + 1}`,
      description:
        criteriaObj?.description ||
        item?.description ||
        "Chưa có mô tả tiêu chí.",
      score: Number(item?.score ?? item?.weight ?? item?.maxScore ?? 0),
    };
  });
}

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(1);
  const [eventData, setEventData] = useState<any>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [rubricByRoundId, setRubricByRoundId] = useState<Record<string, any[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        const eventRes = await adminApi.getEventById(id);
        const event = eventRes?.data ?? eventRes;
        const eventId = pickId(event) || id;

        const [roundRes, trackRes, topicRes] = await Promise.all([
          adminApi.getAllRounds().catch(() => []),
          adminApi.getAllTracks().catch(() => []),
          adminApi.getAllTopics().catch(() => []),
        ]);

        const allRounds = normalizeList(roundRes);
        const allTracks = normalizeList(trackRes);
        const allTopics = normalizeList(topicRes);

        const eventRounds = allRounds
          .filter((round) =>
            sameId(
              round?.eventID || round?.eventId || round?.event?.eventID,
              eventId,
            ),
          )
          .sort(
            (a, b) => Number(a?.roundIndex || 0) - Number(b?.roundIndex || 0),
          );

        const eventTracks = allTracks.filter((track) =>
          sameId(
            track?.eventID || track?.eventId || track?.event?.eventID,
            eventId,
          ),
        );

        const tracksWithTopics = eventTracks.map((track) => {
          const trackId = getTrackId(track);

          return {
            ...track,
            topics: allTopics.filter((topic) =>
              sameId(getTopicTrackId(topic), trackId),
            ),
          };
        });

        const rubricMap: Record<string, any[]> = {};

        await Promise.all(
          eventRounds.map(async (round) => {
            const roundId = getRoundId(round);
            const criteriaSetId = getRoundCriteriaSetId(round);

            if (!criteriaSetId) {
              rubricMap[roundId] = [];
              return;
            }

            try {
              const setDetail = await adminApi.getCriteriaSetById(criteriaSetId);
              rubricMap[roundId] = normalizeCriteriaList(setDetail);
            } catch (error) {
              console.error("Lỗi tải criteria set:", error);
              rubricMap[roundId] = [];
            }
          }),
        );

        setEventData(event);
        setRounds(eventRounds);
        setTracks(tracksWithTopics);
        setRubricByRoundId(rubricMap);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sự kiện:", error);

        Swal.fire({
          icon: "error",
          title: "Không tải được sự kiện",
          text: "Không thể lấy chi tiết sự kiện từ Backend.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Đang tải chi tiết sự kiện...
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Không tìm thấy sự kiện!
        </h2>

        <button
          onClick={() => navigate("/admin/events")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Chi tiết: {getEventName(eventData)}
          </h1>

          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-200">
            <Lock size={12} /> Chỉ xem
          </span>
        </div>

        <button
          onClick={() => navigate("/admin/events")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-slate-700"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-sm font-medium">
        <Lock size={18} className="text-amber-600" />
        Trang này đang hiển thị dữ liệu thật từ API Admin. Những phần Backend
        chưa có endpoint riêng sẽ hiển thị trạng thái chưa có dữ liệu.
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex border-b border-slate-200 px-6 pt-2 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {activeTab === 1 && (
            <TabGeneralInfo
              event={eventData}
              eventId={pickId(eventData) || id || ""}
              nextTab={() => setActiveTab(2)}
            />
          )}

          {activeTab === 2 && (
            <TabPrizes
              prevTab={() => setActiveTab(1)}
              nextTab={() => setActiveTab(3)}
            />
          )}

          {activeTab === 3 && (
            <TabRounds
              rounds={rounds}
              prevTab={() => setActiveTab(2)}
              nextTab={() => setActiveTab(4)}
            />
          )}

          {activeTab === 4 && (
            <TabTracks
              event={eventData}
              tracks={tracks}
              prevTab={() => setActiveTab(3)}
              nextTab={() => setActiveTab(5)}
            />
          )}

          {activeTab === 5 && (
            <TabRubric
              rounds={rounds}
              rubricByRoundId={rubricByRoundId}
              prevTab={() => setActiveTab(4)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyInput({
  label,
  value,
  color = "text-slate-500",
}: {
  label: string;
  value: any;
  color?: string;
}) {
  return (
    <div className="space-y-2">
      <label className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>
        {label}
      </label>

      <input
        type="text"
        readOnly
        value={value || "Chưa có dữ liệu"}
        className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
      />
    </div>
  );
}

function TabGeneralInfo({
  nextTab,
  event,
  eventId,
}: {
  nextTab: () => void;
  event: any;
  eventId: string;
}) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Cấu hình Cơ bản</h3>
        <p className="text-sm text-slate-500">
          Dữ liệu lấy từ endpoint chi tiết sự kiện.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ReadOnlyInput label="Event ID" value={eventId} />
        <ReadOnlyInput label="Tên hiển thị sự kiện" value={getEventName(event)} />
        <ReadOnlyInput label="Học kỳ áp dụng" value={getSemester(event)} />
        <ReadOnlyInput
          label="Vòng hiện tại"
          value={getField(event, ["currentRound"], "0")}
        />
        <ReadOnlyInput
          label="Địa điểm tổ chức"
          value={getField(event, ["location", "venue"], "Backend chưa có field này")}
        />
        <ReadOnlyInput
          label="Thông tin liên hệ"
          value={getField(event, ["contact", "contactInfo"], "Backend chưa có field này")}
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          onClick={nextTab}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
        >
          Tiếp tục: Cơ cấu Giải thưởng →
        </button>
      </div>
    </div>
  );
}

function TabPrizes({
  prevTab,
  nextTab,
}: {
  prevTab: () => void;
  nextTab: () => void;
}) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-bold text-slate-900">
        Thiết lập Cơ cấu Giải thưởng
      </h3>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Chưa có API giải thưởng trong Swagger hiện tại.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Phần này không render dữ liệu giả để tránh lệch Backend.
        </p>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button
          onClick={prevTab}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
        >
          ← Quay lại
        </button>

        <button
          onClick={nextTab}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
        >
          Tiếp tục: Vòng thi & Chia bảng →
        </button>
      </div>
    </div>
  );
}

function TabRounds({
  rounds,
  prevTab,
  nextTab,
}: {
  rounds: any[];
  prevTab: () => void;
  nextTab: () => void;
}) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-bold text-slate-900">
        Vòng thi & Chia bảng
      </h3>

      {rounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 font-medium">
          Chưa có vòng thi nào cho sự kiện này.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên vòng</th>
                <th className="px-6 py-4 text-center">Thứ tự</th>
                <th className="px-6 py-4">Bắt đầu</th>
                <th className="px-6 py-4">Kết thúc</th>
                <th className="px-6 py-4 text-center">Max team</th>
                <th className="px-6 py-4 text-center">Top lên vòng</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rounds.map((round) => (
                <tr key={getRoundId(round)}>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {getField(round, ["roundName", "name"])}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-md font-bold">
                      {getField(round, ["roundIndex"], "0")}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(round?.startDate)}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(round?.endDate)}
                  </td>

                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {getField(round, ["maxTeam"], "0")}
                  </td>

                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {getField(round, ["topNPromotion"], "0")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button
          onClick={prevTab}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
        >
          ← Quay lại
        </button>

        <button
          onClick={nextTab}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
        >
          Tiếp tục: Hạng mục & Mentor →
        </button>
      </div>
    </div>
  );
}

function TabTracks({
  prevTab,
  nextTab,
  event,
  tracks,
}: {
  prevTab: () => void;
  nextTab: () => void;
  event: any;
  tracks: any[];
}) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-bold text-slate-900">
        Phân chia Hạng mục & Cố vấn
      </h3>

      {tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 font-medium">
          Chưa có track nào cho sự kiện này.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên Hạng mục</th>
                <th className="px-6 py-4 text-center">Học kỳ</th>
                <th className="px-6 py-4">Topics</th>
                <th className="px-6 py-4 text-right">Mentor</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tracks.map((track) => {
                const topics = normalizeList(track?.topics);

                return (
                  <tr key={getTrackId(track)}>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {getField(track, ["trackName", "name"])}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 rounded-full font-medium">
                        {getSemester(event)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {topics.length === 0 ? (
                        <span className="italic text-slate-400">
                          Chưa có topic
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic: any, index: number) => (
                            <span
                              key={pickId(topic) || index}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold"
                            >
                              {getField(topic, [
                                "topicDetail",
                                "topicName",
                                "name",
                              ])}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                        <Lock size={12} /> Chưa phân công
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button
          onClick={prevTab}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
        >
          ← Quay lại
        </button>

        <button
          onClick={nextTab}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
        >
          Tiếp tục: Rubric Chấm điểm →
        </button>
      </div>
    </div>
  );
}

function TabRubric({
  prevTab,
  rounds,
  rubricByRoundId,
}: {
  prevTab: () => void;
  rounds: any[];
  rubricByRoundId: Record<string, any[]>;
}) {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  const selectedRound = rounds[selectedRoundIndex] || rounds[0];
  const selectedRoundId = selectedRound ? getRoundId(selectedRound) : "";
  const currentRubrics = rubricByRoundId[selectedRoundId] || [];

  const totalWeight = currentRubrics.reduce(
    (sum, rubric) => sum + (Number(rubric.score) || 0),
    0,
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Rubric Chấm điểm
          </h3>

          <p className="text-sm text-slate-500">
            Dữ liệu lấy từ Criteria Set của từng vòng thi.
          </p>
        </div>

        {rounds.length > 0 && (
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            {rounds.map((round, index) => (
              <button
                key={getRoundId(round)}
                onClick={() => setSelectedRoundIndex(index)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  selectedRoundIndex === index
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {getField(round, ["roundName"], `Vòng ${index + 1}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {rounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 font-medium">
          Chưa có vòng thi nên chưa có rubric.
        </div>
      ) : currentRubrics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 font-medium">
          Chưa có tiêu chí chấm điểm cho vòng này.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
            <span>Tên tiêu chí đánh giá</span>
            <span>Trọng số / Điểm</span>
          </div>

          {currentRubrics.map((rubric, index) => (
            <div
              key={rubric.id || index}
              className="flex gap-4 items-center animate-in fade-in duration-300"
            >
              <input
                type="text"
                readOnly
                value={rubric.name}
                className="flex-1 p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
              />

              <div className="relative w-32">
                <input
                  type="text"
                  readOnly
                  value={rubric.score}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-bold text-center"
                />

                <span className="absolute right-4 top-3.5 text-slate-400 font-bold">
                  %
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-4">
            <span className="font-bold text-slate-700">
              Tổng cộng trọng số:
            </span>

            <span
              className={`text-lg font-bold ${
                totalWeight === 100 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {totalWeight}%
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-start pt-4 border-t border-slate-100">
        <button
          onClick={prevTab}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
        >
          ← Quay lại bước trước
        </button>
      </div>
    </div>
  );
}