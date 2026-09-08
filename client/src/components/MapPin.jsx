const COLORS = {
  attraction: "#EF4444",
  restaurant: "#3B82F6",
  hotel: "#10B981",
  hospital: "#F59E0B",
  bank: "#8B5CF6",
  government: "#1A1A2E",
};

export default function MapPin({ category = "attraction" }) {
  const color = COLORS[category] || COLORS.attraction;
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border-2 border-white shadow"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export { COLORS as MAP_PIN_COLORS };
