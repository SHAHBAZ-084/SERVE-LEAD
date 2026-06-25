const fs = require('fs');
const path = require('path');

const source = 'C:/Users/MZ/.cursor/projects/c-Users-MZ-Desktop-SERVE-LEAD-main/agent-tools/02bafffc-cbb4-4699-8ab6-733e3d46069f.txt';
const outPath = 'C:/Users/MZ/Desktop/SERVE-LEAD-main/frontend/src/constants/pakistanLocations.js';
const raw = JSON.parse(fs.readFileSync(source, 'utf8'));
const locations = {};

for (const province of raw.data) {
  const pName = province.name.en;
  locations[pName] = {};
  for (const district of province.district || []) {
    const dName = district.name.en;
    locations[pName][dName] = (district.tehsil || [])
      .map((t) => t.name.en)
      .sort((a, b) => a.localeCompare(b));
  }
}

const header = `// Administrative data adapted from Open Admin Data (CC-BY-4.0)
// https://github.com/open-admin-data/pakistan-administrative-divisions

export const PAKISTAN_LOCATIONS = `;

const footer = `;

export const PROVINCES = Object.keys(PAKISTAN_LOCATIONS).sort((a, b) => a.localeCompare(b));

export const getDistricts = (province) => {
  if (!province || !PAKISTAN_LOCATIONS[province]) return [];
  return Object.keys(PAKISTAN_LOCATIONS[province]).sort((a, b) => a.localeCompare(b));
};

export const getTehsils = (province, district) => {
  if (!province || !district) return [];
  return PAKISTAN_LOCATIONS[province]?.[district] || [];
};

export const getDefaultDistrict = (province) => getDistricts(province)[0] || "";

export const getDefaultTehsil = (province, district) => getTehsils(province, district)[0] || "";
`;

fs.writeFileSync(outPath, header + JSON.stringify(locations, null, 2) + footer);
console.log('Wrote', outPath, 'provinces:', Object.keys(locations).length);
