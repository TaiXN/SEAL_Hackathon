export function MyTeam() {
  const teamMembers = [
    {
      id: 1,
      name: "Nguyen Quoc Lap",
      initials: "NL",
      role: "Team Leader",
      isCurrentUser: false,
    },
    {
      id: 2,
      name: "Nguyen Huynh Hoang Uyen",
      initials: "NH",
      role: "Frontend Developer",
      isCurrentUser: true,
    },
    {
      id: 3,
      name: "Nguyen Quang Tri",
      initials: "NT",
      role: "Frontend Developer",
      isCurrentUser: false,
    },
    {
      id: 4,
      name: "Nguyen Thien Tai",
      initials: "NT",
      role: "Backend Developer",
      isCurrentUser: false,
    },
    {
      id: 5,
      name: "Le Hoang Anh",
      initials: "LA",
      role: "Backend Developer",
      isCurrentUser: false,
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      <header className="mb-10">
        <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-3">
          My Team
        </h1>
        <p className="text-gray-500 font-medium">
          View your team roster and members.
        </p>
      </header>

      <div className="bg-white border border-gray-200">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Team Roster</h2>
          <div className="bg-gray-100 text-gray-900 px-3 py-1 text-[11px] font-bold tracking-wide rounded-md">
            5 / 5 Members
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm ${member.isCurrentUser ? 'bg-black text-white border-black' : 'border-gray-500 bg-gray-200 text-gray-800'}`}>
                    {member.initials}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[15px] font-bold text-gray-900">{member.name}</p>
                    {member.isCurrentUser && (
                      <span className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-widest">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-gray-500">{member.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
