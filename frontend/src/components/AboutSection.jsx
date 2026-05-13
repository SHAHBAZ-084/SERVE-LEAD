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

        <div className="reveal delay-200 mt-10 text-gray-700 leading-relaxed text-base space-y-6">
          <p>
            Our vision is to serve students through a strong welfare-driven platform where potential is nurtured and opportunities are created. We are a non-political organization working across Punjab, Pakistan, dedicated to the overall welfare and development of students. We strive to provide meaningful support in the form of internships, job placements, and career counseling sessions, helping students make informed decisions and move confidently toward their future.
          </p>
          <p>
            A core part of our mission is student welfare and financial assistance. We are committed to supporting deserving students by contributing to their university fees and educational expenses, ensuring that financial limitations do not become a barrier to their academic journey. We also focus on practical exposure and learning beyond the classroom by organizing industrial tours and educational trips, enabling students to connect theoretical knowledge with real-world experience. Through these efforts, our goal is to build a community of capable, confident, and compassionate individuals who not only succeed in their careers but also give back to society and contribute positively to the development of their communities.
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
