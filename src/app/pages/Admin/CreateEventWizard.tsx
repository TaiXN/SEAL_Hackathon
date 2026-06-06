import { useState } from "react";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  { id: 1, name: "1. Thông tin chung" },
  { id: 2, name: "2. Cơ cấu Giải thưởng" },
  { id: 3, name: "3. Vòng thi & Chia bảng" },
  { id: 4, name: "4. Hạng mục & Mentor" },
  { id: 5, name: "5. Rubric Chấm điểm" },
];

export function CreateEventWizard() {
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();

  // STATE TỔNG CHỨA TOÀN BỘ DỮ LIỆU FORM
  const [formData, setFormData] = useState({
    name: "SEAL Hackathon Fall 2025",
    semester: "Fall 2025",
    openDate: "",
    closeDate: "",
    location: "",
    contact: "",
    prizes: [
      {
        id: 1,
        name: "Giải Nhất",
        count: 1,
        value: "7,000,000",
        gift: "Giấy chứng nhận + Hoa",
      },
    ],
    tracks: [
      { id: 1, name: "Track 1", mentor: "Chưa phân công" },
      { id: 2, name: "Track 2", mentor: "Chưa phân công" },
    ],
    rubrics: {
      prelim: [
        { id: 1, name: "Tính ứng dụng và khả thi", weight: 50 },
        { id: 2, name: "Mức độ tự động hóa & tích hợp AI", weight: 50 },
      ],
      final: [{ id: 3, name: "Độ hoàn thiện của sản phẩm", weight: 100 }],
    },
  });

  const updateForm = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  // LƯU TOÀN BỘ VÀO LOCAL STORAGE
  const handleFinish = () => {
    const newEvent = {
      id: `fall-2025-${Date.now()}`, // ID động để không trùng
      ...formData,
      tracksCount: formData.tracks.length,
      teams: 0,
      status: "Sắp diễn ra",
      // Reset tên Track về mặc định để qua trang chi tiết nhập
      tracks: formData.tracks.map((t, idx) => ({
        id: t.id,
        name: `Track ${idx + 1}`,
        desc: "",
        mentor: t.mentor,
      })),
    };

    const existingEvents = JSON.parse(
      localStorage.getItem("SEAL_EVENTS") || "[]",
    );
    localStorage.setItem(
      "SEAL_EVENTS",
      JSON.stringify([newEvent, ...existingEvents]),
    );
    navigate("/events");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            Khởi tạo Sự kiện mới
          </h1>
          <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[11px] font-bold tracking-wider">
            Kỳ hiện tại: Fall 2025
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <button
            onClick={handleFinish}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 shadow-sm"
          >
            Hoàn tất & Tạo sự kiện
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="flex border-b border-slate-200 px-6 pt-2 overflow-x-auto hide-scrollbar">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap ${activeStep === step.id ? "border-slate-900 text-slate-900" : activeStep > step.id ? "border-transparent text-emerald-600" : "border-transparent text-slate-400"}`}
            >
              {step.name}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
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
            <StepMentors
              data={formData}
              updateForm={updateForm}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}
          {activeStep === 5 && (
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
  );
}

// BƯỚC 1
function StepGeneralInfo({ data, updateForm, nextStep }: any) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Tên hiển thị sự kiện
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateForm("name", e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Học kỳ áp dụng
          </label>
          <select
            value={data.semester}
            onChange={(e) => updateForm("semester", e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 bg-white outline-none"
          >
            <option>Fall 2025</option>
            <option>Summer 2026</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-emerald-600 uppercase">
            Mở cổng đăng ký
          </label>
          <input
            type="datetime-local"
            value={data.openDate}
            onChange={(e) => updateForm("openDate", e.target.value)}
            className="w-full p-3 rounded-lg border border-emerald-300 bg-emerald-50/30 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-red-600 uppercase">
            Đóng cổng & Khóa (Freeze)
          </label>
          <input
            type="datetime-local"
            value={data.closeDate}
            onChange={(e) => updateForm("closeDate", e.target.value)}
            className="w-full p-3 rounded-lg border border-red-300 bg-red-50/30 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Địa điểm tập trung
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => updateForm("location", e.target.value)}
            placeholder="Hội trường Alpha..."
            className="w-full p-3 rounded-lg border border-slate-300 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase">
            Người hỗ trợ
          </label>
          <input
            type="text"
            value={data.contact}
            onChange={(e) => updateForm("contact", e.target.value)}
            placeholder="Chị A (PDP)..."
            className="w-full p-3 rounded-lg border border-slate-300 outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end pt-6 border-t border-slate-100">
        <button
          onClick={nextStep}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 2
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
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
        >
          <Plus size={16} /> Thêm giải thưởng
        </button>
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
            <tr>
              <th className="px-6 py-4">Tên giải thưởng</th>
              <th className="px-6 py-4 w-24">Số lượng</th>
              <th className="px-6 py-4">Giá trị (VNĐ)</th>
              <th className="px-6 py-4">Quà tặng kèm</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.prizes.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePrize(p.id, "name", e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-200 outline-none"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="number"
                    value={p.count}
                    onChange={(e) => updatePrize(p.id, "count", e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-200 text-center outline-none"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.value}
                    onChange={(e) => updatePrize(p.id, "value", e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-200 outline-none"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.gift}
                    onChange={(e) => updatePrize(p.id, "gift", e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-200 outline-none"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <button
                    onClick={() => removePrize(p.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold"
        >
          ← Quay lại
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 3
function StepRoundsAndTracks({ data, updateForm, prevStep, nextStep }: any) {
  const handleTrackCountChange = (count: number) => {
    const newCount = Math.max(1, count);
    const newTracks = Array.from(
      { length: newCount },
      (_, i) =>
        data.tracks.find((t: any) => t.id === i + 1) || {
          id: i + 1,
          name: `Track ${i + 1}`,
          mentor: "Chưa phân công",
        },
    );
    updateForm("tracks", newTracks);
  };
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="border border-slate-200 rounded-xl p-6 bg-white">
        <h4 className="font-bold mb-4">1. Vòng Bảng</h4>
        <input
          type="datetime-local"
          className="w-full p-3 rounded-lg border border-slate-300 outline-none"
        />
      </div>
      <div className="border border-slate-200 rounded-xl p-6 bg-white">
        <h4 className="font-bold text-slate-900 mb-4">
          3. Số lượng Hạng mục thi (Tracks)
        </h4>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            value={data.tracks.length}
            onChange={(e) =>
              handleTrackCountChange(parseInt(e.target.value) || 1)
            }
            className="w-24 text-center text-xl font-bold p-3 rounded-xl border-2 border-blue-300 outline-none"
          />
          <span>Tracks</span>
        </div>
      </div>
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold"
        >
          ← Quay lại
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 4
function StepMentors({ data, updateForm, prevStep, nextStep }: any) {
  const updateMentor = (id: number, mentorName: string) =>
    updateForm(
      "tracks",
      data.tracks.map((t: any) =>
        t.id === id ? { ...t, mentor: mentorName } : t,
      ),
    );
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-bold text-slate-900">
        Phân công Cố vấn (Mentor)
      </h3>
      <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
            <tr>
              <th className="px-6 py-4">Tên Hạng mục</th>
              <th className="px-6 py-4 text-right">Mentor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.tracks.map((t: any) => (
              <tr key={t.id}>
                <td className="px-6 py-5 font-bold">{t.name}</td>
                <td className="px-6 py-5 text-right">
                  <select
                    value={t.mentor}
                    onChange={(e) => updateMentor(t.id, e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 outline-none font-semibold"
                  >
                    <option>Chưa phân công</option>
                    <option>Nguyễn Văn A</option>
                    <option>Trần Thị B</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold"
        >
          ← Quay lại
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}

// BƯỚC 5
function StepRubric({ data, updateForm, prevStep, handleFinish }: any) {
  const [selectedRound, setSelectedRound] = useState<"prelim" | "final">(
    "prelim",
  );
  const currentRubrics = data.rubrics[selectedRound];
  const totalWeight = currentRubrics.reduce(
    (sum: number, r: any) => sum + (Number(r.weight) || 0),
    0,
  );

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
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-slate-900">
          Thiết lập tỷ lệ phần trăm
        </h3>
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSelectedRound("prelim")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${selectedRound === "prelim" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Vòng Bảng
          </button>
          <button
            onClick={() => setSelectedRound("final")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${selectedRound === "final" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Vòng Chung Kết
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {currentRubrics.map((r: any) => (
          <div key={r.id} className="flex gap-4 items-center">
            <input
              type="text"
              value={r.name}
              onChange={(e) => updateRubric(r.id, "name", e.target.value)}
              className="flex-1 p-3 rounded-lg border border-slate-200 outline-none"
              placeholder="Tên tiêu chí..."
            />
            <div className="relative w-32">
              <input
                type="number"
                value={r.weight}
                onChange={(e) => updateRubric(r.id, "weight", e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 text-center font-bold outline-none"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">
                %
              </span>
            </div>
            <button
              onClick={() => removeRubric(r.id)}
              className="text-slate-300 hover:text-red-500 p-2"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button
          onClick={addRubric}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-semibold hover:border-slate-400"
        >
          + Thêm tiêu chí đánh giá mới
        </button>
        <div className="flex justify-between items-center pt-4 font-bold">
          <span className="text-slate-700">Tổng cộng:</span>
          <span
            className={`text-xl ${totalWeight === 100 ? "text-emerald-600" : "text-red-500"}`}
          >
            {totalWeight}%
          </span>
        </div>
      </div>
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold"
        >
          ← Quay lại
        </button>
        <button
          onClick={handleFinish}
          disabled={totalWeight !== 100}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold transition-all ${totalWeight === 100 ? "bg-emerald-600" : "bg-slate-300 cursor-not-allowed"}`}
        >
          <CheckCircle2 size={18} /> Hoàn tất & Tạo
        </button>
      </div>
    </div>
  );
}
