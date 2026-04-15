import { useState, useEffect } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import api from "../api";

const API_BASE = 'https://api.serveandlead.org';
const getImgUrl = (path) => path?.startsWith('http') ? path : `${API_BASE}${path}`;

export default function TeamSection({ memberData = "none", hide = false }) {
  const [activeBodyId, setActiveBodyId] = useState(null);
  const [teamStructure, setTeamStructure] = useState([]);
  const [leadership, setLeadership] = useState(null);
  const ref = useScrollReveal();

  useEffect(() => {
    api.get("settings").then(r => {
      if (r.data.team_structure) {
        try {
          const structure = JSON.parse(r.data.team_structure);
          setTeamStructure(structure);
        } catch (e) { console.error("Parse error", e); }
      }
      if (r.data.team_leadership) {
        try {
          const leader = JSON.parse(r.data.team_leadership);
          setLeadership(leader);
        } catch (e) { console.error("Parse error", e); }
      }
    });
  }, []);

  // Filter for displayTeam (usually just leadership or single member)
  let displayTeam = [];
  if (memberData === "none" || !memberData) {
    displayTeam = leadership ? [leadership] : [];
  } else if (typeof memberData === "object") {
    displayTeam = [memberData];
  }

  const activeCategory = teamStructure.find(c => c.id === activeBodyId);

  return (
    <section ref={ref} id="team" className="bg-gray-50 py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center">
        {!hide && (
          <div className="reveal mb-14">
            <span className="inline-block bg-cyan-100 text-cyan-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3">
              Our People
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">
              About <span className="text-cyan-500">Team Members</span>
            </h2>
          </div>
        )}

        {displayTeam.length > 0 && (
          <div className="flex flex-col space-y-16 md:space-y-24 mb-24">
            {displayTeam.map((member, idx) => (
              <div
                key={idx}
                className={`${idx % 2 === 0 ? "reveal-left" : "reveal-right"} delay-${(idx + 1) * 100} flex flex-col ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-stretch bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden card-hover border border-slate-100`}
              >
                {/* Image Section - High Impact Full-Bleed */}
                <div className="w-full md:w-[35%] lg:w-[30%] flex-shrink-0 overflow-hidden bg-slate-100 relative min-h-[300px] sm:min-h-[400px] md:min-h-0">
                  <img
                    src={getImgUrl(member.img)}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent block md:hidden" />
                  <div className="absolute bottom-6 left-6 block md:hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">Executive Leadership</p>
                    <h3 className="text-2xl font-black text-white">{member.name}</h3>
                  </div>
                </div>

                {/* Content Section - Refined Proportions */}
                <div className="w-full md:w-[65%] lg:w-[70%] p-8 md:p-14 text-center md:text-left flex flex-col justify-center">
                  <div className="hidden md:flex flex-col md:flex-row md:items-center gap-3 mb-6">
                    <span className="inline-block bg-cyan-50 text-cyan-600 text-[10px] font-black tracking-widest uppercase px-5 py-2 rounded-full border border-cyan-100 self-center md:self-start">
                      {member.role}
                    </span>
                    <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest self-center md:self-start">{member.program}</p>
                  </div>

                  <h3 className="hidden md:block text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                    {member.name}
                  </h3>

                  <div className="w-16 md:w-24 h-1.5 md:h-2 bg-slate-900 mb-8 md:mb-10 mx-auto md:mx-0 rounded-full opacity-90 shadow-sm" />

                  <div className="relative">
                    <i className="fas fa-quote-left absolute -top-4 -left-4 md:-top-6 md:-left-6 text-slate-50 text-3xl md:text-5xl -z-10" />
                    <p className="text-slate-600 leading-relaxed text-sm md:text-lg font-medium italic">
                      "{member.desc}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Selection Buttons */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-6">
          {teamStructure.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveBodyId(activeBodyId === cat.id ? null : cat.id)}
              className={`px-6 md:px-8 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${activeBodyId === cat.id ? "bg-slate-900 text-white shadow-slate-900/30 scale-105" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Members of selected category */}
        {activeCategory && (
          <div className="mt-16 md:mt-20 animate-fade-up">

            <div className="flex flex-col space-y-8 md:space-y-12">
              {activeCategory.members.map((member, idx) => (
                <div
                  key={member.id}
                  className={`${idx % 2 === 0 ? "reveal-left" : "reveal-right"} delay-${(idx + 1) * 100} flex flex-col ${idx % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
                    } items-stretch bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden card-hover border border-slate-100 md:h-72`}
                >
                  <div className="w-full md:w-1/3 flex-shrink-0 overflow-hidden bg-slate-100 relative min-h-[250px] md:min-h-0">
                    {member.img ? (
                      <img
                        src={getImgUrl(member.img)}
                        alt={member.name}
                        className="absolute inset-0 w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-200 text-5xl">
                        <i className="fas fa-user-circle" />
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-2/3 p-8 md:p-10 text-center md:text-left flex flex-col justify-center">
                    <span className="inline-block bg-cyan-50 text-cyan-600 text-[9px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-3 self-center md:self-start border border-cyan-100 w-fit">
                      {member.role}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1 tracking-tight">{member.name}</h3>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mb-4">{member.program}</p>
                    <div className="w-10 h-1 bg-cyan-400 mb-4 mx-auto md:mx-0 rounded-full" />
                    <p className="text-slate-600 leading-relaxed text-xs md:text-sm font-medium italic">"{member.desc}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
