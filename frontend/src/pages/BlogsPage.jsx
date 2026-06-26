import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { getImgUrl } from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const IMAGE_COVER_STYLE = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

const BlogThumbnail = ({ images }) => {
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <i className="fas fa-image text-slate-300 text-4xl" />
      </div>
    );
  }

  return (
    <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 border border-slate-100">
      <img
        src={getImgUrl(images[0].url)}
        alt={images[0].caption || "Blog image"}
        className="w-full h-full object-cover block"
        style={IMAGE_COVER_STYLE}
      />
    </div>
  );
};

const BlogSlideshow = ({ images, variant = "slideshow" }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const isDetail = variant === "detail";
  const containerClass = isDetail
    ? "relative w-full aspect-[16/9] overflow-hidden rounded-2xl group bg-slate-50 border border-slate-100"
    : "relative w-full h-80 sm:h-96 overflow-hidden rounded-3xl group bg-slate-50";

  if (!images || images.length === 0) {
    return (
      <div className={`${containerClass} flex items-center justify-center border border-slate-100`}>
        <i className="fas fa-image text-slate-300 text-4xl" />
      </div>
    );
  }

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className={containerClass}>
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={getImgUrl(images[index].url)}
          alt={images[index].caption || "Blog image"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover block"
          style={IMAGE_COVER_STYLE}
        />
      </AnimatePresence>

      {images[index].caption && (
        <div className="absolute bottom-3 left-3 right-10 z-10">
          <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg inline-block border border-white/10">
            {images[index].caption}
          </p>
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
          >
            <i className="fas fa-chevron-right" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await api.get("blogs");
        setBlogs(res.data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="bg-[#FAFBFD] min-h-screen font-sans">
      <Navbar />

      <section className="relative py-24 md:py-32 overflow-hidden">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#002147]/5 rounded-full blur-[150px] -mr-80 -mt-80" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[150px] -ml-80 -mb-80" />

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
               <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight"
               >
                  Society <span className="gradient-text">Journal</span>
               </motion.h1>
               <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-4"
               >
                  <div className="h-[2px] w-12 bg-[#002147]" />
                  <p className="text-slate-400 text-xs md:text-sm font-black uppercase tracking-[0.4em]">Updates & Insights</p>
                  <div className="h-[2px] w-12 bg-[#002147]" />
               </motion.div>
            </div>

            {loading ? (
               <div className="flex justify-center py-20">
                  <div className="w-12 h-12 border-4 border-[#002147] border-t-transparent rounded-full animate-spin" />
               </div>
            ) : blogs.length === 0 ? (
               <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <i className="fas fa-feather-pointed text-slate-100 text-6xl mb-6" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No stories shared yet.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {blogs.map((blog, idx) => (
                     <motion.article
                        key={blog._id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx % 3 * 0.1 }}
                        className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-200/40 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                     >
                        {blog.isExpanded ? (
                          <BlogSlideshow images={blog.images} variant="detail" />
                        ) : (
                          <BlogThumbnail images={blog.images} />
                        )}

                        <div className="mt-4 sm:mt-5 space-y-3 flex-1 flex flex-col">
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 {new Date(blog.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                           </div>

                           <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                              {blog.title}
                           </h2>

                           <div className="relative flex-1">
                              <p className={`text-slate-500 text-sm leading-relaxed font-medium whitespace-pre-wrap ${blog.isExpanded ? "" : "line-clamp-4"}`}>
                                 {blog.isExpanded ? blog.description : (blog.description.length > 200 ? blog.description.substring(0, 200) + "..." : blog.description)}
                              </p>
                              {blog.description.length > 200 && (
                                 <button
                                    type="button"
                                    onClick={() => {
                                       setBlogs((prev) => prev.map((b) => (b._id === blog._id ? { ...b, isExpanded: !b.isExpanded } : b)));
                                    }}
                                    className="mt-2 text-[#002147] font-black uppercase tracking-widest text-[10px] hover:underline"
                                 >
                                    {blog.isExpanded ? "Read Less" : "Read More"}
                                 </button>
                              )}
                           </div>

                           <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 bg-[#002147] rounded-lg flex items-center justify-center text-white shadow-md">
                                    <i className="fas fa-signature text-xs" />
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 leading-none mb-0.5">Society Admin</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verified Author</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.article>
                  ))}
               </div>
            )}
         </div>
      </section>

      <Footer />
    </div>
  );
}
