import { Calendar, Clock, Users } from "lucide-react";

interface TeamCardProps {
  topic: string;
  tags: string[];
  startDate: string;
  deadlineDays: number;
  members: number;
  totalSlots: number;
}

export function TeamCard({
  topic,
  tags,
  startDate,
  deadlineDays,
  members,
  totalSlots,
}: TeamCardProps) {
  const isFull = members === totalSlots;

  return (
    <div className="flex flex-col p-6 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors">
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-zinc-900 mb-6 leading-snug">
        {topic}
      </h3>

      <div className="space-y-3 mb-8 flex-grow">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Calendar className="w-4 h-4" />
            <span>Starts</span>
          </div>
          <span className="text-zinc-900">{startDate}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-4 h-4" />
            <span>Deadline</span>
          </div>
          <span className="text-zinc-900">{deadlineDays} days</span>
        </div>

        <div className="flex items-center justify-between text-sm pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-zinc-500">
            <Users className="w-4 h-4" />
            <span>Team</span>
          </div>
          <span className="text-zinc-900 font-medium">{members} / {totalSlots}</span>
        </div>
        
        {/* Visual Slot Indicator - Flat Design */}
        <div className="flex gap-1 pt-1">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-sm ${
                i < members ? "bg-zinc-900" : "bg-zinc-100"
              }`}
            />
          ))}
        </div>
      </div>

      <button 
        disabled={isFull}
        className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
          isFull 
            ? "bg-zinc-50 text-zinc-400 border border-zinc-200 cursor-not-allowed" 
            : "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50"
        }`}
      >
        {isFull ? "Filled" : "Apply Now"}
      </button>
    </div>
  );
}
