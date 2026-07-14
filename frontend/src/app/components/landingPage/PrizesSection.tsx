import { Trophy, Medal, Award, CheckCircle2 } from "lucide-react";

export function PrizesSection() {
  return (
    <section id="prizes" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-12">
          
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Prizes & Recognition</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-6 p-6 border border-zinc-200 rounded-md bg-zinc-50/50">
                <div className="w-14 h-14 bg-white border border-zinc-200 rounded-md flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-7 h-7 text-zinc-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">1st Place Overall</h3>
                  <p className="text-zinc-600 mt-1">$5,000 + Tech Setup + Fast-track Interviews</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-6 border border-zinc-200 rounded-md">
                <div className="w-14 h-14 bg-zinc-50 rounded-md flex items-center justify-center flex-shrink-0">
                  <Medal className="w-7 h-7 text-zinc-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">2nd Place Overall</h3>
                  <p className="text-zinc-600 mt-1">$2,500 + Fast-track Interviews</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-6 border border-zinc-200 rounded-md">
                <div className="w-14 h-14 bg-zinc-50 rounded-md flex items-center justify-center flex-shrink-0">
                  <Award className="w-7 h-7 text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">3rd Place Overall</h3>
                  <p className="text-zinc-600 mt-1">$1,000</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Judging Criteria</h2>
            <div className="bg-zinc-900 text-white rounded-md p-8">
              <p className="text-sm text-zinc-300 mb-8 leading-relaxed">
                Projects will be evaluated by industry experts and academic faculty based on the following engineering metrics:
              </p>
              <ul className="space-y-6">
                {[
                  { title: "Application & Scale", desc: "Real-world viability and architectural scalability." },
                  { title: "Automation & Logic", desc: "Algorithmic efficiency and codebase quality." },
                  { title: "UI & Usability", desc: "Clean interface and seamless user experience." },
                  { title: "Presentation", desc: "Clarity of the technical pitch." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <CheckCircle2 className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm text-white block mb-1">{item.title}</span>
                      <span className="text-sm text-zinc-400 block">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
