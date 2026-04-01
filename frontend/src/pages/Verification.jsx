import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";
import TeamSection from "../components/TeamSection";
import VerificationSection from "../components/VerificationSection";
import farooq from '../assets/farooq_lefty1.jpg'

export default function Verification() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TeamSection memberData={{
        role: "Founders Message",
        name: "Farooq Baloch",
        program: "Automotive Engineer",
        desc: "I am honored to introduce Serve and Lead Society Lahore (SLS), an initiative founded with the vision of empowering students through leadership, career development, and community service. Our mission is to help students unlock their potential by providing opportunities such as internships, career guidance, educational programs, and welfare initiatives. Through these efforts, we aim to support students in building successful careers while encouraging them to contribute positively to society. I warmly invite students to join SLS, where we work together to learn, serve, and lead with purpose toward growth and excellence.",
        img: farooq,
        align: "right",
      }} hide={true} />
      <VerificationSection />
      <Footer />
    </>
  );
}
