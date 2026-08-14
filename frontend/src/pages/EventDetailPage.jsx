import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getImgUrl } from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EventShareButton from "../components/EventShareButton";
import CountdownTimer from "../components/common/CountdownTimer";
import { formatEventDateRange } from "../utils/eventShare";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`events/${id}`);
        if (!cancelled) setEvent(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Event not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const dateStr = event?.endDate || event?.date
    ? new Date(event.endDate || event.date).toISOString().split("T")[0]
    : "";
  const targetDate = `${dateStr}T${event?.time || "23:59"}:00`;
  const isLive = event ? Date.now() < new Date(targetDate).getTime() : false;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleJoin = async () => {
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${id}`)}`);
      return;
    }
    setJoining(true);
    setJoinMsg(null);
    try {
      await api.post(`events/${id}/join`, {});
      setJoinMsg("You are registered for this event.");
    } catch (err) {
      setJoinMsg(err.response?.data?.error || "Could not join this event.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="bg-[#FAFBFD] min-h-screen font-sans">
      <Navbar />
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <Link
            to="/#events"
            className="inline-flex items-center gap-2 text-[#002147] font-black uppercase tracking-widest text-[10px] mb-10 hover:underline"
          >
            <i className="fas fa-arrow-left" /> Back to events
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#002147] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || !event ? (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <i className="fas fa-calendar-alt text-slate-200 text-5xl mb-6" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-6">{error || "Event not found."}</p>
              <Link to="/#events" className="text-[#002147] font-black uppercase tracking-widest text-[10px] hover:underline">
                Return to events
              </Link>
            </div>
          ) : (
            <article className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-100">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={getImgUrl(event.image_url)}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 bg-white/90 px-4 py-2 rounded-2xl shadow-lg border border-white/50">
                  <p className="text-xs font-black text-slate-900">
                    {new Date(event.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="absolute top-6 right-6">
                  <EventShareButton event={event} variant="overlay" />
                </div>
              </div>
              <div className="p-6 sm:p-10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-cyan-600 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</span>
                  )}
                  <CountdownTimer targetDate={targetDate} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {event.title}
                </h1>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                    <i className="fas fa-calendar text-[#002147] mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</p>
                      <p className="text-sm font-bold text-slate-700">{formatEventDateRange(event)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                    <i className="fas fa-clock text-[#002147] mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time</p>
                      <p className="text-sm font-bold text-slate-700">{event.time || "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl sm:col-span-2">
                    <i className="fas fa-location-dot text-[#002147] mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Venue</p>
                      <p className="text-sm font-bold text-slate-700">{event.location || "TBA"}</p>
                    </div>
                  </div>
                </div>
                {event.description && (
                  <p className="mt-8 text-slate-600 text-base whitespace-pre-wrap leading-relaxed font-medium">
                    {event.description}
                  </p>
                )}
                {joinMsg && (
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#002147]">{joinMsg}</p>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  {isLive && (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joining}
                      className="px-8 py-4 rounded-2xl bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-60"
                    >
                      {joining ? "Joining..." : token ? "Join this event" : "Login to join"}
                    </button>
                  )}
                  <EventShareButton event={event} variant="plain" />
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
