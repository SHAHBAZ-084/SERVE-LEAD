import { PROVINCES, getDistricts, getTehsils, ALL_PROVINCES_LABEL, ALL_DISTRICTS_LABEL, ALL_TEHSILS_LABEL } from "../../constants/pakistanLocations";

export { ALL_PROVINCES_LABEL, ALL_DISTRICTS_LABEL, ALL_TEHSILS_LABEL };

export const DEFAULT_ADMIN_LOCATION_FILTER = {
  province: ALL_PROVINCES_LABEL,
  district: ALL_DISTRICTS_LABEL,
  tehsil: ALL_TEHSILS_LABEL,
};

export const matchesAdminLocationFilter = (member, filter) => {
  const norm = (v) => (v || "").trim().toLowerCase();
  if (filter.province !== ALL_PROVINCES_LABEL && norm(member.province) !== norm(filter.province)) return false;
  if (filter.district !== ALL_DISTRICTS_LABEL && norm(member.district) !== norm(filter.district)) return false;
  if (filter.tehsil !== ALL_TEHSILS_LABEL) {
    const t = norm(filter.tehsil);
    if (norm(member.tehsil) !== t && norm(member.city) !== t) return false;
  }
  return true;
};

export const appendLocationFilterParams = (params, filter) => {
  if (filter.province !== ALL_PROVINCES_LABEL) params.set("province", filter.province);
  if (filter.district !== ALL_DISTRICTS_LABEL) params.set("district", filter.district);
  if (filter.tehsil !== ALL_TEHSILS_LABEL) params.set("tehsil", filter.tehsil);
};

export default function AdminLocationFilters({ filter, onChange, selectCls, onFilterChange }) {
  const districtOptions = filter.province !== ALL_PROVINCES_LABEL ? getDistricts(filter.province) : [];
  const tehsilOptions =
    filter.province !== ALL_PROVINCES_LABEL && filter.district !== ALL_DISTRICTS_LABEL
      ? getTehsils(filter.province, filter.district)
      : [];

  const applyChange = (next) => {
    onChange(next);
    onFilterChange?.();
  };

  return (
    <>
      <select
        value={filter.province}
        onChange={(e) =>
          applyChange({
            province: e.target.value,
            district: ALL_DISTRICTS_LABEL,
            tehsil: ALL_TEHSILS_LABEL,
          })
        }
        className={selectCls}
      >
        <option value={ALL_PROVINCES_LABEL}>{ALL_PROVINCES_LABEL}</option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        value={filter.district}
        onChange={(e) =>
          applyChange({
            ...filter,
            district: e.target.value,
            tehsil: ALL_TEHSILS_LABEL,
          })
        }
        disabled={filter.province === ALL_PROVINCES_LABEL}
        className={selectCls}
      >
        <option value={ALL_DISTRICTS_LABEL}>{ALL_DISTRICTS_LABEL}</option>
        {districtOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        value={filter.tehsil}
        onChange={(e) => applyChange({ ...filter, tehsil: e.target.value })}
        disabled={filter.province === ALL_PROVINCES_LABEL || filter.district === ALL_DISTRICTS_LABEL}
        className={selectCls}
      >
        <option value={ALL_TEHSILS_LABEL}>{ALL_TEHSILS_LABEL}</option>
        {tehsilOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </>
  );
}
