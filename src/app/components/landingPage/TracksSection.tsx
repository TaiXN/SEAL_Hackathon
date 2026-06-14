import { Globe, Cpu, Database } from "lucide-react";

export function TracksSection() {
  const tracks = [
    { 
      icon: Globe, 
      title: "Web App", 
      desc: "Build scalable web platforms addressing modern enterprise challenges, focusing on distributed systems and heavy traffic." 
    },
    { 
      icon: Cpu, 
      title: "IoT Systems", 
      desc: "Develop integrated hardware-software solutions for smart environments, optimizing sensor data flow and edge computing." 
    },
    { 
      icon: Database, 
      title: "AI/Data", 
      desc: "Create data-driven applications utilizing machine learning models, predictive analytics, and large-scale data processing." 
    }
  ];

  return (
    <section id="tracks" className="py-24 border-b border-zinc-200 bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">Hackathon Tracks</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">Choose a specialized engineering domain and solve specific industry problems.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tracks.map((track, i) => (
            <div key={i} className="p-8 bg-white border border-zinc-200 rounded-md hover:border-zinc-300 transition-colors flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-zinc-100 flex items-center justify-center rounded-md mb-6">
                <track.icon className="w-7 h-7 text-zinc-900" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{track.title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{track.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
