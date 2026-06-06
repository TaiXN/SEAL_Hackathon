export function TimelineSection() {
  const phases = [
    { 
      title: "Registration", 
      date: "Oct 1 - Oct 15", 
      desc: "Form your teams, finalize your ideas, and submit formal applications." 
    },
    { 
      title: "Preliminary Round", 
      date: "Oct 20 - Oct 22", 
      desc: "An intensive 48-hour coding sprint followed by initial prototype submissions." 
    },
    { 
      title: "Finals", 
      date: "Oct 29", 
      desc: "The top 10 teams pitch their functional software to industry judges." 
    }
  ];

  return (
    <section id="timeline" className="py-24 border-b border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-16 text-center">Event Timeline</h2>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
          {/* Connecting Line (Horizontal on Desktop, Vertical on Mobile) */}
          <div className="absolute top-0 bottom-0 left-[15px] md:left-0 md:top-6 md:bottom-auto md:w-full w-px md:h-px bg-zinc-200 z-0"></div>
          
          {phases.map((phase, i) => (
            <div key={i} className="relative z-10 flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-5 mb-10 md:mb-0 w-full md:w-1/3">
              <div className="w-8 h-8 rounded-full bg-white border-[3px] border-zinc-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-900 shadow-[0_0_0_8px_white]">
                {i + 1}
              </div>
              
              <div className="md:text-center pt-1 md:pt-0">
                <h3 className="text-lg font-bold text-zinc-900">{phase.title}</h3>
                <p className="text-sm font-semibold text-zinc-500 mt-1 mb-2">{phase.date}</p>
                <p className="text-sm text-zinc-600 md:max-w-[260px] mx-auto leading-relaxed">{phase.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
