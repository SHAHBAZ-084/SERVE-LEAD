import bg from "../assets/bg2.jpeg";
import useScrollReveal from "../hooks/useScrollReveal";

export default function AboutSection() {
  const ref = useScrollReveal();

  return (
    <section
      ref={ref}
      id="about"
      className="relative py-20 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[2px]" />

      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <div className="reveal">
          <span className="inline-block bg-cyan-100 text-cyan-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Who We Are
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-cyan-600 mb-2">About Us</h2>
          <p className="italic font-semibold text-gray-700 text-lg">
            "Building Leaders Through Service and Growth."
          </p>
        </div>

        <div className="reveal delay-200 mt-10">
          <h3 className="text-2xl font-bold mb-4 text-cyan-600">Advantages</h3>
          <p className="text-gray-700 leading-relaxed text-base">
            Our vision is to empower students by creating a dynamic platform where potential meets
            opportunity. We are dedicated to providing meaningful internships, job placements, and
            career counseling sessions that guide students toward success and self-discovery. Beyond
            professional growth, we are equally committed to student welfare — supporting deserving
            individuals by helping with university fees, ensuring that no financial challenge hinders
            their educational journey.
          </p>
          <p className="text-gray-700 leading-relaxed text-base mt-6">
            In addition, we aim to organize industrial tours and educational trips that bridge the gap
            between academic learning and practical experience, inspiring students to explore, learn,
            and grow beyond the classroom. Through these collective efforts, we aspire to cultivate a
            generation of capable, confident, and compassionate students who not only achieve personal
            success but also contribute positively to the community around them.
          </p>
        </div>

        {/* Feature pills */}
        <div className="reveal delay-400 flex flex-wrap justify-center gap-3 mt-8">
          {["Internships", "Career Counseling", "Welfare Support", "Industrial Tours", "Leadership"].map((tag) => (
            <span
              key={tag}
              className="bg-white/80 border border-cyan-200 text-cyan-700 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm hover:bg-cyan-50 hover:scale-105 transition-all duration-200 cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
