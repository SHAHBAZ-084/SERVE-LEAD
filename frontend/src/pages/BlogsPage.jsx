import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { getImgUrl } from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BlogSlideshow = ({ images }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (!images || images.length === 0) return (
    <div className="w-full h-64 bg-slate-100 flex items-center justify-center rounded-2xl">
      <i className="fas fa-image text-slate-300 text-4xl" />
    </div>
  );

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative w-full h-80 sm:h-96 overflow-hidden rounded-3xl group">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={getImgUrl(images[index].url)}
          alt={images[index].caption || "Blog image"}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

      {/* Caption Badge */}
      {images[index].caption && (
        <div className="absolute bottom-6 left-6 right-12 z-10">
           <p className="text-white text-xs font-bold uppercase tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl inline-block border border-white/10">
             {images[index].caption}
           </p>
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
          >
            <i className="fas fa-chevron-right" />
          </button>
        </>
      )}

      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 right-6 flex gap-2 z-20">
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} 
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
         {/* Background Orbs */}
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
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
                  {blogs.map((blog, idx) => (
                     <motion.article 
                        key={blog._id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx % 2 * 0.1 }}
                        className="bg-white rounded-[3rem] p-6 sm:p-10 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                     >
                        <BlogSlideshow images={blog.images} />

                        <div className="mt-10 space-y-6">
                           <div className="flex items-center gap-4">

                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 {new Date(blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                           </div>

                           <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                              {blog.title}
                           </h2>

                           <p className="text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">
                              {blog.description}
                           </p>

                           <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-[#002147] rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <i className="fas fa-signature" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none mb-1">Society Admin</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verified Author</p>
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
