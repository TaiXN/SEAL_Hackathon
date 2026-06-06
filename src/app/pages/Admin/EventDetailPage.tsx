import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// 1. DATABASE ĐÃ ĐƯỢC CẬP NHẬT THÊM RUBRIC
const EVENT_DB = {
  "summer-2025": {
    name: "SEAL Hackathon Summer 2025",
    semester: "Summer 2025",
    openDate: "15/05/2025 08:00",
    closeDate: "30/05/2025 23:59",
    location: "Hội trường tòa nhà Delta, FPTU HCM",
    contact: "Chị Nguyễn Thị B (Phòng PDP) - Email: bnt@fpt.edu.vn",
    tracks: [
      {
        name: "Blockchain & Web3",
        desc: "Tích hợp công nghệ chuỗi khối và hợp đồng thông minh.",
        mentor: "Trần Thị B",
      },
      {
        name: "Requirements Engineering App",
        desc: "Phân tích SRS/User Stories, phát hiện mâu thuẫn.",
        mentor: "Nguyễn Văn A",
      },
    ],
    rubric: {
      prelim: [
        { name: "Tính ứng dụng và khả thi", weight: 30 },
        { name: "Mức độ tự động hóa & tích hợp AI", weight: 30 },
        { name: "Giao diện và trải nghiệm người dùng", weight: 20 },
        { name: "Slide trình bày và demo", weight: 20 },
      ],
      final: [
        { name: "Độ hoàn thiện của sản phẩm", weight: 30 },
        { name: "Mức độ sáng tạo và đột phá", weight: 25 },
        { name: "Hiệu quả thực thi và trải nghiệm", weight: 20 },
        { name: "Tính mở rộng và khả năng tích hợp", weight: 15 },
        { name: "Kỹ năng trình bày và phản biện", weight: 10 },
      ],
    },
  },
  "spring-2025": {
    name: "SEAL Hackathon Spring 2025",
    semester: "Spring 2025",
    openDate: "10/01/2025 08:00",
    closeDate: "28/01/2025 23:59",
    location: "Phòng 302, Tòa nhà Alpha, FPTU HCM",
    contact: "Anh Lê Văn C (Phòng CTSV) - Email: cvt@fpt.edu.vn",
    tracks: [
      {
        name: "AI & Machine Learning",
        desc: "Phát triển mô hình AI tối ưu hóa quy trình.",
        mentor: "Phạm Văn D",
      },
    ],
    rubric: {
      prelim: [
        { name: "Tính ứng dụng và khả thi", weight: 30 },
        { name: "Mức độ tự động hóa & tích hợp AI", weight: 30 },
        { name: "Giao diện và trải nghiệm người dùng", weight: 20 },
        { name: "Slide trình bày và demo", weight: 20 },
      ],
      final: [
        { name: "Độ hoàn thiện của sản phẩm", weight: 30 },
        { name: "Mức độ sáng tạo và đột phá", weight: 25 },
        { name: "Hiệu quả thực thi và trải nghiệm", weight: 20 },
        { name: "Tính mở rộng và khả năng tích hợp", weight: 15 },
        { name: "Kỹ năng trình bày và phản biện", weight: 10 },
      ],
    },
  },
};

const tabs = [
  { id: 1, name: "1. Thông tin chung" },
  { id: 2, name: "2. Cơ cấu Giải thưởng" },
  { id: 3, name: "3. Vòng thi & Chia bảng" },
  { id: 4, name: "4. Hạng mục & Mentor" },
  { id: 5, name: "5. Rubric Chấm điểm" },
];

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);

  const eventData = EVENT_DB[id as keyof typeof EVENT_DB];

  if (!eventData) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Không tìm thấy sự kiện!
        </h2>
        <button
          onClick={() => navigate("/events")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Chi tiết: {eventData.name}
          </h1>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-200">
            <Lock size={12} /> Đã kết thúc
          </span>
        </div>
        <button
          onClick={() => navigate("/events")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-slate-700"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-sm font-medium">
        <Lock size={18} className="text-amber-600" />
        Sự kiện này đã kết thúc. Tất cả cấu hình đang ở chế độ{" "}
        <span className="font-bold">chỉ xem</span> và không thể thay đổi.
      </div>

      {/* Tabs Navigation */}
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

        {/* Tab Content Area (Đã truyền thêm eventData vào TabRubric) */}
        <div className="p-8 flex-1">
          {activeTab === 1 && (
            <TabGeneralInfo nextTab={() => setActiveTab(2)} event={eventData} />
          )}
          {activeTab === 2 && (
            <TabPrizes
              prevTab={() => setActiveTab(1)}
              nextTab={() => setActiveTab(3)}
            />
          )}
          {activeTab === 3 && (
            <TabRounds
              prevTab={() => setActiveTab(2)}
              nextTab={() => setActiveTab(4)}
            />
          )}
          {activeTab === 4 && (
            <TabTracks
              prevTab={() => setActiveTab(3)}
              nextTab={() => setActiveTab(5)}
              event={eventData}
            />
          )}
          {activeTab === 5 && (
            <TabRubric prevTab={() => setActiveTab(4)} event={eventData} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabGeneralInfo({
  nextTab,
  event,
}: {
  nextTab: () => void;
  event: any;
}) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Cấu hình Cơ bản</h3>
        <p className="text-sm text-slate-500">
          Định danh sự kiện, địa điểm tập trung và thiết lập khung thời gian mở
          cổng đăng ký.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tên hiển thị sự kiện
          </label>
          <input
            type="text"
            readOnly
            value={event.name}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Học kỳ áp dụng
          </label>
          <input
            type="text"
            readOnly
            value={event.semester}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Mở cổng đăng ký
          </label>
          <input
            type="text"
            readOnly
            value={event.openDate}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
            Đóng cổng & Khóa (Freeze)
          </label>
          <input
            type="text"
            readOnly
            value={event.closeDate}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Địa điểm tập trung
          </label>
          <input
            type="text"
            readOnly
            value={event.location}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Thông tin liên hệ
          </label>
          <input
            type="text"
            readOnly
            value={event.contact}
            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
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
  const prizes = [
    {
      name: "Giải Nhất",
      count: 1,
      value: "7,000,000",
      gift: "Giấy chứng nhận + Hoa",
    },
    {
      name: "Giải Nhì",
      count: 1,
      value: "5,000,000",
      gift: "Giấy chứng nhận + Hoa",
    },
    {
      name: "Giải Ba",
      count: 1,
      value: "3,000,000",
      gift: "Giấy chứng nhận + Hoa",
    },
    {
      name: "Giải Ý tưởng sáng tạo",
      count: 1,
      value: "1,000,000",
      gift: "Giấy chứng nhận",
    },
    {
      name: "Giải Cá nhân xuất sắc",
      count: 1,
      value: "1,000,000",
      gift: "Giấy chứng nhận",
    },
  ];
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-bold text-slate-900">
        Thiết lập Cơ cấu Giải thưởng
      </h3>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Tên giải thưởng</th>
              <th className="px-6 py-4 text-center">Số lượng</th>
              <th className="px-6 py-4">Giá trị (VNĐ)</th>
              <th className="px-6 py-4">Quà tặng kèm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prizes.map((prize, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 font-semibold text-slate-700">
                  {prize.name}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 bg-slate-100 rounded-md font-bold">
                    {prize.count}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{prize.value}</td>
                <td className="px-6 py-4 text-slate-600">{prize.gift}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  prevTab,
  nextTab,
}: {
  prevTab: () => void;
  nextTab: () => void;
}) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="border border-slate-200 rounded-xl overflow-hidden p-6">
        <h4 className="font-bold text-slate-900 mb-4">
          1. Vòng Bảng (Prelim Round)
        </h4>
        <input
          type="text"
          readOnly
          value="Đã chọn 5 giám khảo - Số đội tối đa mỗi bảng: 6"
          className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
        />
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden p-6">
        <h4 className="font-bold text-slate-900 mb-4">
          2. Vòng Chung Kết (Final Round)
        </h4>
        <input
          type="text"
          readOnly
          value="Đã chọn 3 giám khảo - Lấy Top 2 đội điểm cao nhất"
          className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
        />
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
}: {
  prevTab: () => void;
  nextTab: () => void;
  event: any;
}) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-bold text-slate-900">
        Phân chia Hạng mục & Cố vấn
      </h3>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Tên Hạng mục</th>
              <th className="px-6 py-4 text-center">Học kỳ</th>
              <th className="px-6 py-4">Mô tả</th>
              <th className="px-6 py-4 text-right">Mentor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {event.tracks.map((t: any, idx: number) => (
              <tr key={idx}>
                <td className="px-6 py-4 font-semibold text-slate-700">
                  {t.name}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 bg-slate-100 rounded-full font-medium">
                    {event.semester}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{t.desc}</td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <Lock size={12} /> {t.mentor}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          Tiếp tục: Rubric Chấm điểm →
        </button>
      </div>
    </div>
  );
}

// --- TAB 5 ĐÃ ĐƯỢC MỞ KHÓA VÀ RENDER DYNAMIC THEO DATA ---
function TabRubric({ prevTab, event }: { prevTab: () => void; event: any }) {
  const [selectedRound, setSelectedRound] = useState<"prelim" | "final">(
    "prelim",
  );

  // Lấy dữ liệu rubric từ CSDL tương ứng với vòng thi đang chọn
  const currentRubrics = event.rubric[selectedRound];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Thiết lập tỷ lệ phần trăm chấm thi
          </h3>
          <p className="text-sm text-slate-500">
            Định nghĩa cấu trúc điểm số cốt lõi. Hệ thống sẽ tự động nhân hệ số
            khi Giám khảo nhập điểm.
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedRound("prelim")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${selectedRound === "prelim" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            Vòng Bảng
          </button>
          <button
            onClick={() => setSelectedRound("final")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${selectedRound === "final" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            Vòng Chung Kết
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
          <span>Tên tiêu chí đánh giá</span>
          <span>Trọng số %</span>
        </div>

        {currentRubrics.map((rubric: any, idx: number) => (
          <div
            key={idx}
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
                value={rubric.weight}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-bold text-center"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">
                %
              </span>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-4">
          <span className="font-bold text-slate-700">Tổng cộng trọng số:</span>
          <span className="text-lg font-bold text-emerald-600">100%</span>
        </div>
      </div>

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
