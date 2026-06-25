export const ABOUT_DEFAULTS = {
  about_badge: "Who We Are",
  about_title: "About Us",
  about_subtitle: "Building Leaders Through Service and Growth.",
  about_section_heading: "Advantages",
  about_paragraph_1:
    "Our vision is to empower students by creating a dynamic platform where potential meets opportunity. We are dedicated to providing meaningful internships, job placements, and career counseling sessions that guide students toward success and self-discovery. Beyond professional growth, we are equally committed to student welfare — supporting deserving individuals by helping with university fees, ensuring that no financial challenge hinders their educational journey.",
  about_paragraph_2:
    "In addition, we aim to organize industrial tours and educational trips that bridge the gap between academic learning and practical experience, inspiring students to explore, learn, and grow beyond the classroom. Through these collective efforts, we aspire to cultivate a generation of capable, confident, and compassionate students who not only achieve personal success but also contribute positively to the community around them.",
  about_tags: "Internships, Career Counseling, Welfare Support, Industrial Tours, Leadership",
};

export const ABOUT_FIELDS = [
  { key: "about_badge", label: "Badge Label", placeholder: "Who We Are" },
  { key: "about_title", label: "Page Title", placeholder: "About Us" },
  { key: "about_subtitle", label: "Subtitle / Motto", placeholder: "Building Leaders Through Service and Growth." },
  { key: "about_section_heading", label: "Section Heading", placeholder: "Advantages" },
  {
    key: "about_paragraph_1",
    label: "Paragraph 1",
    placeholder: "First paragraph of the about section...",
    multiline: true,
  },
  {
    key: "about_paragraph_2",
    label: "Paragraph 2",
    placeholder: "Second paragraph of the about section...",
    multiline: true,
  },
  {
    key: "about_tags",
    label: "Feature Tags (comma-separated)",
    placeholder: "Internships, Career Counseling, Welfare Support",
    multiline: true,
  },
];

export const parseAboutSettings = (data = {}) =>
  Object.fromEntries(
    ABOUT_FIELDS.map(({ key }) => [key, data[key] ?? ABOUT_DEFAULTS[key]])
  );

export const parseAboutTags = (tagsStr = "") =>
  tagsStr
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
