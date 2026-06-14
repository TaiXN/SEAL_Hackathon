import { useState } from "react";
import { Plus, Trash2, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { adminApi, pickId } from "../../lib/api/adminApi";

const steps = [
  { id: 1, name: "1. Thông tin chung" },
  { id: 2, name: "2. Cơ cấu Giải thưởng" },
  { id: 3, name: "3. Hạng mục & Cố vấn" },
  { id: 4, name: "4. Rubric Chấm điểm" },
];

export function CreateEventWizard() {
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "SEAL Hackathon Fall 2025",
    semester: "Fall 2025",
    openDate: "",
    closeDate: "",
    location: "",
    contact: "",
    maxTeams: 42,
    prizes: [
      {
        id: 1,
        name: "Giải Nhất",
        count: 1,
        value: "7,000,000",
        gift: "Giấy chứng nhận + Hoa",
      },
      {
        id: 2,
        name: "Giải Nhì",
        count: 1,
        value: "5,000,000",
        gift: "Giấy chứng nhận + Hoa",
      },
      {
        id: 3,
        name: "Giải Ba",
        count: 1,
        value: "3,000,000",
        gift: "Giấy chứng nhận + Hoa",
      },
    ],
    rounds: {
      prelim: {
        deadline: "",
        judges: "Đã chọn 5 giám khảo",
        maxPerPool: 6,
        topAdvance: 2,
      },
      final: { deadline: "", judges: "Đã chọn 3 giám khảo" },
    },
    trackCount: 2,
    tracks: [
      {
        id: 1,
        name: "Track 1",
        topics: ["Business Analysis App"],
        mentor: "Chưa phân công",
      },
      {
        id: 2,
        name: "Track 2",
        topics: ["Software Design App", "Code Generation & Review App"],
        mentor: "Chưa phân công",
      },
    ],
    rubrics: {
      prelim: [
        { id: 1, name: "Tính ứng dụng và khả thi", weight: 50 },
        { id: 2, name: "Mức độ tự động hóa & tích hợp AI", weight: 50 },
      ],
      final: [{ id: 5, name: "Độ hoàn thiện của sản phẩm", weight: 100 }],
    },
  });

  const updateForm = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));
  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

const toIso = (value?: string) => {
  return value ? new Date(value).toISOString() : new Date().toISOString();
};

const normalizeList = (value: any): any[] => {
  const data = value?.data ?? value;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;

  return [];
};

const findCriterionByName = (criteriaList: any[], name: string) => {
  const cleanName = name.trim().toLowerCase();

  return criteriaList.find((criterion: any) => {
    const criterionName = (
      criterion.criteriaName ||
      criterion.name ||
      ""
    )
      .trim()
      .toLowerCase();

    return criterionName === cleanName;
  });
};

const getOrCreateCriterionId = async (
  criteriaName: string,
  description: string,
) => {
  const cleanName = criteriaName.trim();

  if (!cleanName) {
    throw new Error("Tên tiêu chí không được để trống.");
  }

  // 1. Check trước xem criteria đã tồn tại chưa
  const allCriteriaBefore = normalizeList(await adminApi.getAllCriteria());
  const existedCriterion = findCriterionByName(allCriteriaBefore, cleanName);

  if (existedCriterion) {
    const existedId = pickId(existedCriterion);

    if (existedId) {
      console.log("Dùng lại criteria đã có:", cleanName, existedId);
      return existedId;
    }
  }

  // 2. Nếu chưa có thì tạo mới
  try {
    await adminApi.createCriterion({
      criteriaName: cleanName,
      description,
    });
  } catch (error: any) {
    console.warn("Tạo criteria bị lỗi, thử fetch lại xem đã tồn tại chưa:", {
      criteriaName: cleanName,
      status: error.response?.status,
      data: error.response?.data,
    });
  }

  // 3. Sau khi tạo hoặc lỗi trùng tên, fetch lại để lấy ID
  const allCriteriaAfter = normalizeList(await adminApi.getAllCriteria());
  const createdOrExistingCriterion = findCriterionByName(
    allCriteriaAfter,
    cleanName,
  );

  const criteriaId = pickId(createdOrExistingCriterion);

  if (!criteriaId) {
    throw new Error(`Không lấy được criteriaId cho tiêu chí: ${cleanName}`);
  }

  return criteriaId;
};

const findCriteriaSetByName = (setList: any[], setName: string) => {
  const cleanName = setName.trim().toLowerCase();

  return setList.find((set: any) => {
    const currentName = (
      set.setName ||
      set.criteriaSetName ||
      set.name ||
      ""
    )
      .trim()
      .toLowerCase();

    return currentName === cleanName;
  });
};

const getOrCreateCriteriaSetId = async (
  setName: string,
  criteriaList: { criteriaId: string; score: number }[],
) => {
  const cleanSetName = setName.trim();

  if (!cleanSetName) {
    throw new Error("Tên Criteria Set không được để trống.");
  }

  const allSetsBefore = normalizeList(await adminApi.getAllCriteriaSets());
  const existedSet = findCriteriaSetByName(allSetsBefore, cleanSetName);

  if (existedSet) {
    const existedSetId = pickId(existedSet);

    if (existedSetId) {
      console.log("Dùng lại criteria set đã có:", cleanSetName, existedSetId);
      return existedSetId;
    }
  }

  try {
    const setRes: any = await adminApi.createCriteriaSet({
      setName: cleanSetName,
      isDefault: false,
      criteriaList,
    });

    console.log("Response tạo Criteria Set:", setRes);

    const directId = pickId(setRes);
    if (directId) return directId;
  } catch (error: any) {
    console.warn("Tạo criteria set bị lỗi, thử fetch lại:", {
      setName: cleanSetName,
      status: error.response?.status,
      data: error.response?.data,
    });
  }

  const allSetsAfter = normalizeList(await adminApi.getAllCriteriaSets());

  console.log("Danh sách Criteria Set sau khi tạo:", allSetsAfter);

  const createdOrExistingSet = [...allSetsAfter].reverse().find((set: any) => {
    const currentName = (
      set.setName ||
      set.criteriaSetName ||
      set.name ||
      ""
    )
      .trim()
      .toLowerCase();

    return currentName === cleanSetName.toLowerCase();
  });

  const criteriaSetId = pickId(createdOrExistingSet);

  console.log("Criteria Set vừa tìm được:", createdOrExistingSet);
  console.log("criteriaSetId:", criteriaSetId);

  if (!criteriaSetId) {
    throw new Error(`Không lấy được criteriaSetID cho set: ${cleanSetName}`);
  }

  return criteriaSetId;
};

const findTrackByNameAndEventId = (
  trackList: any[],
  trackName: string,
  eventId: string,
) => {
  const cleanTrackName = trackName.trim().toLowerCase();

  return trackList.find((track: any) => {
    const currentTrackName = (track.trackName || track.name || "")
      .trim()
      .toLowerCase();

    const currentEventId =
      track.eventId || track.eventID || track.event?.eventId || track.event?.eventID;

    return (
      currentTrackName === cleanTrackName &&
      String(currentEventId) === String(eventId)
    );
  });
};

const getOrCreateTrackId = async (eventId: string, trackName: string) => {
  const cleanTrackName = trackName.trim();

  if (!cleanTrackName) {
    throw new Error("Tên Track không được để trống.");
  }

  const allTracksBefore = normalizeList(await adminApi.getAllTracks());
  const existedTrack = findTrackByNameAndEventId(
    allTracksBefore,
    cleanTrackName,
    eventId,
  );

  if (existedTrack) {
    const existedTrackId = pickId(existedTrack);

    if (existedTrackId) {
      console.log("Dùng lại track đã có:", cleanTrackName, existedTrackId);
      return existedTrackId;
    }
  }

  try {
    const trackRes: any = await adminApi.createTrack({
      eventId,
      trackName: cleanTrackName,
    });

    console.log("Response tạo Track:", trackRes);

    const directId = pickId(trackRes);
    if (directId) return directId;
  } catch (error: any) {
    console.warn("Tạo track bị lỗi, thử fetch lại:", {
      trackName: cleanTrackName,
      status: error.response?.status,
      data: error.response?.data,
    });
  }

  const allTracksAfter = normalizeList(await adminApi.getAllTracks());

  console.log("Danh sách Track sau khi tạo:", allTracksAfter);

  const createdOrExistingTrack = [...allTracksAfter].reverse().find((track) => {
    const currentTrackName = (track.trackName || track.name || "")
      .trim()
      .toLowerCase();

    const currentEventId =
      track.eventId || track.eventID || track.event?.eventId || track.event?.eventID;

    return (
      currentTrackName === cleanTrackName.toLowerCase() &&
      String(currentEventId) === String(eventId)
    );
  });

  console.log("Track vừa tìm được:", createdOrExistingTrack);

  const trackId = pickId(createdOrExistingTrack);

  console.log("trackId:", trackId);

  if (!trackId) {
    throw new Error(`Không lấy được trackId cho track: ${cleanTrackName}`);
  }

  return trackId;
};

const isRubricTotalValid = (roundKey: "prelim" | "final") => {
  const total = formData.rubrics[roundKey].reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0,
  );

  return total === 100;
};

const handleFinish = async () => {
  try {
    // Check dữ liệu trước khi gọi API
    if (!formData.name.trim()) {
      Swal.fire("Thiếu thông tin", "Vui lòng nhập tên sự kiện.", "warning");
      return;
    }

    if (!formData.openDate || !formData.closeDate) {
      Swal.fire(
        "Thiếu thời gian",
        "Vui lòng nhập ngày mở cổng và ngày đóng cổng.",
        "warning",
      );
      return;
    }

    const openDate = new Date(formData.openDate);
const closeDate = new Date(formData.closeDate);
const prelimDeadline = new Date(formData.rounds.prelim.deadline);
const finalDeadline = new Date(formData.rounds.final.deadline);

if (
  Number.isNaN(openDate.getTime()) ||
  Number.isNaN(closeDate.getTime()) ||
  Number.isNaN(prelimDeadline.getTime()) ||
  Number.isNaN(finalDeadline.getTime())
) {
  Swal.fire(
    "Thời gian chưa hợp lệ",
    "Vui lòng kiểm tra lại ngày giờ của sự kiện.",
    "warning",
  );
  return;
}

if (closeDate <= openDate) {
  Swal.fire(
    "Thời gian chưa hợp lệ",
    "Ngày đóng cổng phải sau ngày mở cổng.",
    "warning",
  );
  return;
}

if (prelimDeadline <= closeDate) {
  Swal.fire(
    "Deadline vòng bảng chưa hợp lệ",
    "Deadline vòng bảng phải sau ngày đóng cổng đăng ký.",
    "warning",
  );
  return;
}

if (finalDeadline <= prelimDeadline) {
  Swal.fire(
    "Deadline chung kết chưa hợp lệ",
    "Deadline vòng chung kết phải sau deadline vòng bảng.",
    "warning",
  );
  return;
}

    if (!formData.rounds.prelim.deadline || !formData.rounds.final.deadline) {
      Swal.fire(
        "Thiếu deadline",
        "Vui lòng nhập deadline cho cả vòng bảng và vòng chung kết.",
        "warning",
      );
      return;
    }

    if (!isRubricTotalValid("prelim") || !isRubricTotalValid("final")) {
      Swal.fire(
        "Rubric chưa hợp lệ",
        "Tổng trọng số của cả Vòng Bảng và Vòng Chung Kết đều phải bằng 100%.",
        "warning",
      );
      return;
    }

    const hasInvalidTrack = formData.tracks.some(
      (track) => !track.name.trim() || track.topics.length === 0,
    );

    if (hasInvalidTrack) {
      Swal.fire(
        "Track chưa hợp lệ",
        "Mỗi track cần có tên và ít nhất 1 topic.",
        "warning",
      );
      return;
    }

    Swal.fire({
      title: "Đang khởi tạo...",
      text: "Hệ thống đang tạo sự kiện, tiêu chí, vòng thi, track và topic.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // 1. Tạo Event (tao beo)
    const [season, yearStr] = formData.semester.split(" ");

const eventPayload = {
  eventName: formData.name.trim(),
  season: season || "Spring",
  year: Number(yearStr) || 2026,
};

console.log("Payload tạo Event:", eventPayload);

const eventRes: any = await adminApi.createEvent(eventPayload);

console.log("Response tạo Event:", eventRes);

// Backend hiện tại trả text: "Create event successfully"
// nên mình không lấy ID trực tiếp từ response được.
let eventId = pickId(eventRes);

if (!eventId) {
  console.warn("Backend không trả eventId, đang gọi lại danh sách Event...");

  const allEventsRes: any = await adminApi.getAllEvents();

  const allEventsRaw = Array.isArray(allEventsRes)
  ? allEventsRes
  : allEventsRes?.data || allEventsRes?.items || [];

const allEvents = allEventsRaw.filter((event: any) => {
  return (
    event.isActive !== false &&
    event.isDeleted !== true &&
    event.deleted !== true
  );
});

  console.log("Danh sách Event sau khi tạo:", allEvents);

  const createdEvent = [...allEvents].reverse().find((event: any) => {
    const sameName =
      event.eventName === eventPayload.eventName ||
      event.name === eventPayload.eventName;

    const sameSeason = event.season === eventPayload.season;
    const sameYear = Number(event.year) === Number(eventPayload.year);

    return sameName && sameSeason && sameYear;
  });

  console.log("Event vừa tìm được:", createdEvent);

  eventId = pickId(createdEvent);
}

console.log("eventId dùng để tạo Round/Track:", eventId);

if (!eventId) {
  throw new Error(
    "Tạo Event thành công nhưng không tìm được eventId từ danh sách Event.",
  );
}

    // 2. Tạo Criteria cho Prelim
    const prelimCriteriaList = await Promise.all(
  formData.rubrics.prelim.map(async (rubric) => {
    const criteriaId = await getOrCreateCriterionId(
      rubric.name,
      "Tiêu chí vòng bảng",
    );

    return {
      criteriaId,
      score: Number(rubric.weight),
    };
  }),
);

    // 3. Tạo Criteria Set cho Prelim
const prelimCriteriaSetId = await getOrCreateCriteriaSetId(
  `${formData.name.trim()} - Prelim Criteria Set`,
  prelimCriteriaList,
);

// 4. Tạo Criteria cho Final
const finalCriteriaList = await Promise.all(
  formData.rubrics.final.map(async (rubric) => {
    const criteriaId = await getOrCreateCriterionId(
      rubric.name,
      "Tiêu chí vòng chung kết",
    );

    return {
      criteriaId,
      score: Number(rubric.weight),
    };
  }),
);

// 5. Tạo Criteria Set cho Final
const finalCriteriaSetId = await getOrCreateCriteriaSetId(
  `${formData.name.trim()} - Final Criteria Set`,
  finalCriteriaList,
);

    // 6. Tạo Round Prelim
const prelimRoundPayload = {
  eventID: eventId,
  roundName: `${formData.name.trim()} - Prelim Round`,
  startDate: toIso(formData.openDate),
  endDate: toIso(formData.rounds.prelim.deadline),
  topNPromotion: Number(formData.rounds.prelim.topAdvance) || 2,
  maxTeam: Number(formData.maxTeams) || 40,
  roundIndex: 0,
  criteriaSetID: prelimCriteriaSetId,
};

console.log("Payload tạo Prelim Round:", prelimRoundPayload);

await adminApi.createRound(prelimRoundPayload);

// 7. Tạo Round Final
const finalRoundPayload = {
  eventID: eventId,
  roundName: `${formData.name.trim()} - Final Round`,
  startDate: toIso(formData.rounds.prelim.deadline),
  endDate: toIso(formData.rounds.final.deadline),
  topNPromotion: 1,
  maxTeam: Number(formData.rounds.prelim.topAdvance) || 2,
  roundIndex: 1,
  criteriaSetID: finalCriteriaSetId,
};

console.log("Payload tạo Final Round:", finalRoundPayload);

await adminApi.createRound(finalRoundPayload);

    // 8. Tạo Track + Topic
for (const track of formData.tracks) {
  const trackId = await getOrCreateTrackId(eventId, track.name);

  for (const topic of track.topics) {
    try {
      await adminApi.createTopic({
        trackID: trackId,
        topicDetail: topic.trim(),
      });

      console.log("Tạo topic thành công:", topic);
    } catch (error: any) {
      console.warn("Tạo topic thất bại, bỏ qua topic này:", {
        topic,
        trackId,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  }
}

    Swal.fire({
      icon: "success",
      title: "Tạo sự kiện thành công!",
      text: "Event, criteria set, round, track và topic đã được tạo.",
    }).then(() => {
      navigate("/admin/events");
    });
  } catch (error: any) {
  console.error("Lỗi tạo sự kiện:", error);
  console.error("Status:", error.response?.status);
  console.error("Backend response:", error.response?.data);

  const backendMessage =
    error.response?.data?.message ||
    error.response?.data?.title ||
    error.response?.data ||
    "Có lỗi khi lưu dữ liệu. Mở F12 Console để xem chi tiết.";

  Swal.fire({
    icon: "error",
    title: "Lỗi khởi tạo",
    text:
      typeof backendMessage === "string"
        ? backendMessage
        : JSON.stringify(backendMessage),
  });
}
};

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen p-10 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Khởi tạo Sự kiện mới
            </h2>
            <span className="px-3 py-1 bg-black text-white rounded-full text-[11px] font-bold tracking-wider mt-1">
              Kỳ hiện tại: {formData.semester}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => navigate("/admin/events")}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            >
              ← Quay lại
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="flex border-b border-slate-200 px-6 pt-2 overflow-x-auto hide-scrollbar bg-white">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeStep === step.id ? "border-black text-black" : activeStep > step.id ? "border-transparent text-slate-700 hover:text-black" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                {step.name}
              </button>
            ))}
          </div>

          <div className="p-8 flex-1 bg-[#f8f9fa]/30">
            {activeStep === 1 && (
              <StepGeneralInfo
                data={formData}
                updateForm={updateForm}
                nextStep={nextStep}
              />
            )}
            {activeStep === 2 && (
              <StepPrizes
                data={formData}
                updateForm={updateForm}
                prevStep={prevStep}
                nextStep={nextStep}
              />
            )}
            {activeStep === 3 && (
              <StepRoundsAndTracks
                data={formData}
                updateForm={updateForm}
                prevStep={prevStep}
                nextStep={nextStep}
              />
            )}
            {activeStep === 4 && (
              <StepRubric
                data={formData}
                updateForm={updateForm}
                prevStep={prevStep}
                handleFinish={handleFinish}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// BƯỚC 1: THÔNG TIN CHUNG
function StepGeneralInfo({ data, updateForm, nextStep }: any) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Cấu hình Cơ bản</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tên hiển thị sự kiện
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateForm("name", e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Học kỳ áp dụng
          </label>
          <select
            value={data.semester}
            onChange={(e) => updateForm("semester", e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium cursor-pointer"
          >
            <option>Fall 2025</option>
            <option>Spring 2026</option>
            <option>Summer 2026</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Mở cổng đăng ký
          </label>
          <input
            type="datetime-local"
            value={data.openDate}
            onChange={(e) => updateForm("openDate", e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 rounded-xl border border-emerald-200 outline-none font-medium text-emerald-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
            Đóng cổng & Khóa danh sách (Freeze)
          </label>
          <input
            type="datetime-local"
            value={data.closeDate}
            onChange={(e) => updateForm("closeDate", e.target.value)}
            className="w-full px-4 py-3 bg-red-50/50 rounded-xl border border-red-200 outline-none font-medium text-red-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Địa điểm tổ chức
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => updateForm("location", e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Hotline / Phòng ban
          </label>
          <input
            type="text"
            value={data.contact}
            onChange={(e) => updateForm("contact", e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Giới hạn tổng số đội thi
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={data.maxTeams}
              onChange={(e) => updateForm("maxTeams", parseInt(e.target.value))}
              className="w-24 px-3 py-2 bg-white rounded-lg border border-slate-200 text-center font-bold outline-none"
            />
            <span className="text-sm text-slate-600 font-medium">đội</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-6">
        <button
          onClick={nextStep}
          className="px-6 py-3 rounded-xl bg-black text-white font-bold shadow-md hover:bg-slate-800 transition-colors"
        >
          Tiếp tục: Cơ cấu Giải thưởng →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 2: GIẢI THƯỞNG
function StepPrizes({ data, updateForm, prevStep, nextStep }: any) {
  const addPrize = () =>
    updateForm("prizes", [
      ...data.prizes,
      { id: Date.now(), name: "", count: 1, value: "", gift: "" },
    ]);
  const removePrize = (id: number) =>
    updateForm(
      "prizes",
      data.prizes.filter((p: any) => p.id !== id),
    );
  const updatePrize = (id: number, field: string, val: string) =>
    updateForm(
      "prizes",
      data.prizes.map((p: any) => (p.id === id ? { ...p, [field]: val } : p)),
    );
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">
          Thiết lập Cơ cấu Giải thưởng
        </h3>
        <button
          onClick={addPrize}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} /> Thêm giải thưởng
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 w-1/3">Tên giải thưởng</th>
              <th className="px-6 py-4 text-center w-24">Số lượng</th>
              <th className="px-6 py-4 w-40">Giá trị (VNĐ)</th>
              <th className="px-6 py-4">Quà tặng kèm</th>
              <th className="px-6 py-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.prizes.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePrize(p.id, "name", e.target.value)}
                    className="w-full px-4 py-2 bg-transparent rounded-lg border border-transparent hover:border-slate-200 focus:bg-white outline-none font-semibold text-slate-900"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="number"
                    min="1"
                    value={p.count}
                    onChange={(e) => updatePrize(p.id, "count", e.target.value)}
                    className="w-16 px-2 py-2 bg-transparent rounded-lg border border-slate-200 text-center font-bold outline-none"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.value}
                    onChange={(e) => updatePrize(p.id, "value", e.target.value)}
                    className="w-full px-4 py-2 bg-transparent rounded-lg border border-transparent hover:border-slate-200 focus:bg-white outline-none font-medium"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.gift}
                    onChange={(e) => updatePrize(p.id, "gift", e.target.value)}
                    className="w-full px-4 py-2 bg-transparent rounded-lg border border-transparent hover:border-slate-200 focus:bg-white outline-none font-medium"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <button
                    onClick={() => removePrize(p.id)}
                    className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-6 border-t border-slate-200">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
        >
          ← Quay lại
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-3 rounded-xl bg-black text-white font-bold shadow-md hover:bg-slate-800 transition-colors"
        >
          Tiếp tục: Vòng thi & Hạng mục →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 3: HẠNG MỤC VÀ CỐ VẤN
function StepRoundsAndTracks({ data, updateForm, prevStep, nextStep }: any) {
  const [topicInputs, setTopicInputs] = useState<{ [key: number]: string }>({});

  const updateRound = (roundKey: string, field: string, value: any) => {
    updateForm("rounds", {
      ...data.rounds,
      [roundKey]: { ...data.rounds[roundKey], [field]: value },
    });
  };

  const handleTrackCountChange = (count: number) => {
    const newCount = Math.max(1, count);
    updateForm("trackCount", newCount);
    const newTracks = Array.from({ length: newCount }, (_, i) => {
      return (
        data.tracks[i] || {
          id: Date.now() + i,
          name: `Track ${i + 1}`,
          topics: [],
          mentor: "Chưa phân công",
        }
      );
    });
    updateForm("tracks", newTracks);
  };

  const updateTrack = (id: number, field: string, val: string) =>
    updateForm(
      "tracks",
      data.tracks.map((t: any) => (t.id === id ? { ...t, [field]: val } : t)),
    );

  const addTopicToTrack = (trackId: number, topicName: string) => {
    if (!topicName || topicName.trim() === "") return;
    updateForm(
      "tracks",
      data.tracks.map((t: any) => {
        if (t.id === trackId && !t.topics.includes(topicName.trim())) {
          return { ...t, topics: [...t.topics, topicName.trim()] };
        }
        return t;
      }),
    );
    setTopicInputs((prev) => ({ ...prev, [trackId]: "" }));
  };

  const removeTopicFromTrack = (trackId: number, topicName: string) => {
    updateForm(
      "tracks",
      data.tracks.map((t: any) => {
        if (t.id === trackId)
          return {
            ...t,
            topics: t.topics.filter((topic: string) => topic !== topicName),
          };
        return t;
      }),
    );
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-black text-slate-900 text-lg">
            1. Vòng Bảng (Prelim Round)
          </h4>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
            Mặc định
          </span>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Thời hạn nộp bài
            </label>
            <input
              type="datetime-local"
              value={data.rounds.prelim.deadline}
              onChange={(e) =>
                updateRound("prelim", "deadline", e.target.value)
              }
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Phân công giám khảo
            </label>
            <select
              value={data.rounds.prelim.judges}
              onChange={(e) => updateRound("prelim", "judges", e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
            >
              <option>Đã chọn 5 giám khảo</option>
              <option>Đã chọn 10 giám khảo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-black text-slate-900 text-lg">
            2. Vòng Chung Kết (Final Round)
          </h4>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
            Vòng cuối
          </span>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Thời hạn nộp bài
            </label>
            <input
              type="datetime-local"
              value={data.rounds.final.deadline}
              onChange={(e) => updateRound("final", "deadline", e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Phân công giám khảo
            </label>
            <select
              value={data.rounds.final.judges}
              onChange={(e) => updateRound("final", "judges", e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium"
            >
              <option>Đã chọn 3 giám khảo</option>
              <option>Đã chọn 5 giám khảo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
        <h4 className="font-black text-slate-900 text-lg mb-6">
          3. Hạng mục thi đấu (Tracks) & Cố vấn
        </h4>

        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-sm font-bold text-slate-700">
            Số lượng Hạng mục (Tracks):
          </span>
          <input
            type="number"
            min="1"
            max="5"
            value={data.trackCount}
            onChange={(e) =>
              handleTrackCountChange(parseInt(e.target.value) || 1)
            }
            className="w-20 text-center px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-4">
          {data.tracks.map((t: any, index: number) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
            >
              <div className="font-black text-slate-800 text-sm uppercase">
                TRACK {index + 1}
              </div>

              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Tên Hạng Mục
                  </label>
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => updateTrack(t.id, "name", e.target.value)}
                    className="w-full px-3 py-2 mt-1 bg-slate-50 rounded-lg border border-slate-200 outline-none font-bold text-sm text-slate-900 focus:border-blue-400"
                    placeholder="Tên Track..."
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Cố Vấn (Mentor)
                  </label>
                  <select
                    value={t.mentor}
                    onChange={(e) =>
                      updateTrack(t.id, "mentor", e.target.value)
                    }
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 cursor-pointer font-semibold"
                  >
                    <option>Chưa phân công</option>
                    <option>Sarah Nguyễn (VNG)</option>
                    <option>Dr. Alex (FPT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Các Chủ Đề Thuộc Track
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {t.topics.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold"
                    >
                      {topic}
                      <button
                        onClick={() => removeTopicFromTrack(t.id, topic)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {t.topics.length === 0 && (
                    <span className="text-xs font-medium text-slate-400 italic py-1.5">
                      Chưa có chủ đề nào...
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topicInputs[t.id] || ""}
                    onChange={(e) =>
                      setTopicInputs({ ...topicInputs, [t.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTopicToTrack(t.id, topicInputs[t.id]);
                      }
                    }}
                    placeholder="+ Nhập tên chủ đề mới và ấn Enter..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={() => addTopicToTrack(t.id, topicInputs[t.id])}
                    className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Quay lại
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-slate-800"
        >
          Tiếp tục: Rubric Chấm điểm →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 4: RUBRIC CHẤM ĐIỂM
function StepRubric({ data, updateForm, prevStep, handleFinish }: any) {
  const [selectedRound, setSelectedRound] = useState<"prelim" | "final">(
    "prelim",
  );
  const currentRubrics = data.rubrics[selectedRound];
  const prelimTotal = data.rubrics.prelim.reduce(
  (sum: number, r: any) => sum + (Number(r.weight) || 0),
  0,
);

const finalTotal = data.rubrics.final.reduce(
  (sum: number, r: any) => sum + (Number(r.weight) || 0),
  0,
);

const canFinish = prelimTotal === 100 && finalTotal === 100;

  const addRubric = () =>
    updateForm("rubrics", {
      ...data.rubrics,
      [selectedRound]: [
        ...currentRubrics,
        { id: Date.now(), name: "", weight: 0 },
      ],
    });
  const removeRubric = (id: number) =>
    updateForm("rubrics", {
      ...data.rubrics,
      [selectedRound]: currentRubrics.filter((r: any) => r.id !== id),
    });
  const updateRubric = (id: number, field: string, val: string | number) =>
    updateForm("rubrics", {
      ...data.rubrics,
      [selectedRound]: currentRubrics.map((r: any) =>
        r.id === id ? { ...r, [field]: val } : r,
      ),
    });

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Thiết lập tỷ lệ phần trăm chấm thi
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Định nghĩa cấu trúc điểm số cốt lõi.
          </p>
        </div>
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <button
            onClick={() => setSelectedRound("prelim")}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${selectedRound === "prelim" ? "bg-white shadow border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            Vòng Bảng
          </button>
          <button
            onClick={() => setSelectedRound("final")}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${selectedRound === "final" ? "bg-white shadow border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            Vòng Chung Kết
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 px-4">
          <div className="flex-1">Tên tiêu chí đánh giá</div>
          <div className="w-32 text-center">Trọng số %</div>
          <div className="w-10"></div>
        </div>
        <div className="space-y-4">
          {currentRubrics.map((r: any) => (
            <div key={r.id} className="flex gap-4 items-center">
              <input
                type="text"
                value={r.name}
                onChange={(e) => updateRubric(r.id, "name", e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium focus:border-blue-500"
                placeholder="Tên tiêu chí..."
              />
              <div className="relative w-32">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={r.weight}
                  onChange={(e) => updateRubric(r.id, "weight", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-black focus:border-blue-500 pr-8"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">
                  %
                </span>
              </div>
              <button
                onClick={() => removeRubric(r.id)}
                className="w-10 flex justify-center text-slate-300 hover:text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button
            onClick={addRubric}
            className="w-full py-4 border border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold text-sm hover:border-slate-500 hover:bg-slate-50"
          >
            + Thêm tiêu chí đánh giá mới
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className="text-slate-900 font-bold">Tổng cộng trọng số:</span>
        <span
          className={`text-xl font-black ${prelimTotal === 100 ? "text-emerald-600" : "text-red-500"}`}
        >
          {prelimTotal}%
        </span>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Quay lại bước trước
        </button>
        <button
          onClick={handleFinish}
          disabled={!canFinish}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold transition-all ${canFinish ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"}`}
        >
          <CheckCircle2 size={18} /> Hoàn tất & Khởi tạo Sự kiện
        </button>
      </div>
    </div>
  );
}
