import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api, { getImgUrl } from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const IMAGE_COVER_STYLE = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

function shareUrlFor(blogId) {
  return `${window.location.origin}/blogs/${blogId}`;
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`blogs/${id}`);
        if (!cancelled) setBlog(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Blog post not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBlog();
    return () => { cancelled = true; };
  }, [id]);

  const url = blog ? shareUrlFor(blog._id) : "";
  const title = blog?.title || "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="bg-[#FAFBFD] min-h-screen font-sans">
      <Navbar />

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#002147]/5 rounded-full blur-[150px] -mr-80 -mt-80" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[150px] -ml-80 -mb-80" />

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-[#002147] font-black uppercase tracking-widest text-[10px] mb-10 hover:underline"
          >
            <i className="fas fa-arrow-left" /> Back to Journals
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#002147] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || !blog ? (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <i className="fas fa-feather-pointed text-slate-200 text-5xl mb-6" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-6">{error || "Blog not found."}</p>
              <Link to="/blogs" className="text-[#002147] font-black uppercase tracking-widest text-[10px] hover:underline">
                Return to blogs
              </Link>
            </div>
          ) : (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/40 border border-slate-100"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {new Date(blog.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </span>

              <h1 className="mt-4 text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {blog.title}
              </h1>

              {blog.images?.length > 0 && (
                <div className="mt-8 space-y-4">
                  {blog.images.map((img, i) => (
                    <div key={i} className="w-full aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 border border-slate-100">
                      <img
                        src={getImgUrl(img.url)}
                        alt={img.caption || blog.title}
                        className="w-full h-full object-cover block"
                        style={IMAGE_COVER_STYLE}
                      />
                      {img.caption && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">{img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-8 text-slate-600 text-base text-justify whitespace-pre-wrap leading-relaxed font-medium">
                {blog.description}
              </p>

              <div className="mt-10 pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Share this story</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-[#002147] hover:text-white transition-all"
                  >
                    <i className={`fas ${copied ? "fa-check" : "fa-link"}`} />
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    <i className="fab fa-whatsapp" /> WhatsApp
                  </a>
                  <a
                    href={linkedInHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 hover:text-white transition-all"
                  >
                    <i className="fab fa-linkedin-in" /> LinkedIn
                  </a>
                  <a
                    href={facebookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <i className="fab fa-facebook-f" /> Facebook
                  </a>
                </div>
              </div>
            </motion.article>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
