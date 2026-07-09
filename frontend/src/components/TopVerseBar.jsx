export default function TopVerseBar() {
  return (
    <div className="top-verse-bar" role="banner" aria-label="Quranic verse announcement">
      <div className="top-verse-bar__inner">
        <p className="top-verse-bar__ref">Surah Al-Ahzab, Ayat 40</p>
        <p className="top-verse-bar__arabic" dir="rtl" lang="ar">
          مَا كَانَ مُحَمَّدٌ اَبَآ اَحَدٍ مِّنْ رِّجَالِكُمْ وَلٰـكِنْ رَّسُوْلَ اللّٰهِ وَخَاتَمَ النَّبِيّٖنَ ۚ وَكَانَ اللّٰهُ بِكُلِّ شَیْءٍ عَلِیْمًا
        </p>
        <p className="top-verse-bar__urdu" dir="rtl" lang="ur">
          محمدﷺ تمہارے مردوں میں سے کسی کے والد نہیں ہیں بلکہ اللہ کے رسول اور خاتم النبیین ہیں، اور اللہ ہر چیز سے واقف ہے۔
        </p>
      </div>
    </div>
  );
}
