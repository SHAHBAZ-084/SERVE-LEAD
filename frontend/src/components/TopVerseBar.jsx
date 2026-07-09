import { useEffect, useRef } from "react";

const ARABIC_AYAT =
  "مَا كَانَ مُحَمَّدٌ اَبَآ اَحَدٍ مِّنْ رِّجَالِكُمْ وَلٰـكِنْ رَّسُوْلَ اللّٰهِ وَخَاتَمَ النَّبِيّٖنَ ۚ وَكَانَ اللّٰهُ بِكُلِّ شَیْءٍ عَلِیْمًا";

const URDU_TRANSLATION =
  "محمدﷺ تمہارے مردوں میں سے کسی کے والد نہیں ہیں بلکہ اللہ کے رسول اور خاتم النبیین ہیں، اور اللہ ہر چیز سے واقف ہے۔";

export default function TopVerseBar() {
  const barRef = useRef(null);

  useEffect(() => {
    const syncHeight = () => {
      if (barRef.current) {
        document.documentElement.style.setProperty(
          "--top-verse-bar-height",
          `${barRef.current.offsetHeight}px`
        );
      }
    };

    syncHeight();
    window.addEventListener("resize", syncHeight);
    return () => {
      window.removeEventListener("resize", syncHeight);
      document.documentElement.style.removeProperty("--top-verse-bar-height");
    };
  }, []);

  return (
    <div ref={barRef} className="top-verse-bar" role="banner" aria-label="Quranic verse announcement">
      <p className="top-verse-bar-arabic">{ARABIC_AYAT}</p>
      <p className="top-verse-bar-urdu">{URDU_TRANSLATION}</p>
    </div>
  );
}
