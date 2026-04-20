import { useState, useEffect } from "react";
import api, { getImgUrl } from "../api";
import farooq from "../assets/farooq12.jpg";

export default function ChairmanHomeSection() {
    const [vision, setVision] = useState({
        badgeSubtitle: "Chairman Vision",
        badgeName: "Farooq Baloch",
        mainTitle: "Empowering student leaders for a better Pakistan.",
        quote: "As Chairman of Serve and Lead Society Lahore (SLS), my vision is to empower students by creating elite opportunities for leadership and career excellence. We strive to build a strong community where financial challenges never become a barrier to excellence.",
        img: null
    });

    useEffect(() => {
        api.get("settings").then(r => {
            if (r.data.vision_section) {
                try {
                    const data = JSON.parse(r.data.vision_section);
                    setVision({
                        badgeSubtitle: data.badgeSubtitle || "Chairman Vision",
                        badgeName: data.badgeName || "Farooq Baloch",
                        mainTitle: data.mainTitle || "Empowering student leaders for a better Pakistan.",
                        quote: data.quote || "As Chairman of Serve and Lead Society Lahore (SLS), my vision is to empower students by creating elite opportunities for leadership and career excellence. We strive to build a strong community where financial challenges never become a barrier to excellence.",
                        img: data.img
                    });
                } catch (e) {
                    console.error("Settings parse error", e);
                }
            }
        }).catch(err => console.error("Failed to fetch settings", err));
    }, []);

    // Split title to potentially wrap 'leaders' in style if it's the default title
    const renderTitle = () => {
        if (vision.mainTitle === "Empowering student leaders for a better Pakistan.") {
            return (
                <>
                    Empowering student <span className="gradient-text italic font-serif">leaders</span> for a better Pakistan.
                </>
            );
        }
        return vision.mainTitle;
    };

    return (
        <section className="py-20 md:py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 animate-fade-up">
                    {/* Chairman Image Section */}
                    <div className="relative group w-full lg:w-1/2 flex justify-center">
                        <div className="relative w-full max-w-sm lg:max-w-none">
                            {/* Modern Frame */}
                            <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-full h-full border-2 border-cyan-500/20 rounded-3xl" />
                            <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-full h-full border-2 border-slate-900/5 rounded-3xl" />

                            <img
                                src={vision.img ? getImgUrl(vision.img) : farooq}
                                alt={`${vision.badgeName} - Chairman`}
                                className="w-full aspect-[4/5] object-cover shadow-2xl relative z-10 group-hover:scale-[1.02] transition-all duration-700 rounded-3xl grayscale group-hover:grayscale-0"
                            />

                            {/* Floating title badge */}
                            <div className="absolute bottom-6 -right-4 md:bottom-10 md:-right-10 glass-dark text-white p-4 md:p-6 shadow-2xl z-20 animate-float border-l-[3px] border-cyan-500">
                                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-1">{vision.badgeSubtitle}</p>
                                <p className="text-sm md:text-base font-bold tracking-tight">{vision.badgeName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chairman Content Section */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start pt-8 lg:pt-0">
                        <div className="w-12 h-1 bg-cyan-500 mb-6 lg:mb-8 rounded-full" />
                        <h2 className="text-3xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 text-center lg:text-left tracking-tighter">
                            {renderTitle()}
                        </h2>
                        
                        <div className="bg-white p-8 md:p-12 relative mb-10 w-full rounded-3xl border-l-[6px] border-cyan-500 shadow-xl shadow-slate-200/50">
                            <i className="fas fa-quote-left text-4xl md:text-5xl text-cyan-500/10 absolute -top-4 -left-2" />
                            <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium relative z-10 italic">
                                "{vision.quote}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/4 h-full bg-slate-100/30 -skew-x-12 -z-10 hidden lg:block" />
        </section>
    );
}
