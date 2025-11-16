// App.js
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";
import Login from "./Login";
import Signup from "./Signup";

// -------------------------
// Browser Notification util
// -------------------------
function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    });
  }
}

// -------------------------
// Fix Leaflet icons
// -------------------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// -------------------------
// District dataset with coordinates
// -------------------------
const DISTRICT_DATA = {
  ahmednagar: {
    district: "Ahmednagar",
    center: [19.0946, 74.7384],
    fruits: ["Pomegranate", "Guava", "Sweet Orange (Mosambi)"],
    crops: [
      "Sugarcane",
      "Jowar",
      "Bajra",
      "Cotton",
      "Soybean",
      "Wheat",
      "Pulses",
    ],
  },
  akola: {
    district: "Akola",
    center: [20.7059, 77.0219],
    fruits: ["Orange", "Sweet Lime", "Sapota"],
    crops: ["Cotton", "Soybean", "Jowar", "Pulses"],
  },
  amravati: {
    district: "Amravati",
    center: [20.9374, 77.7796],
    fruits: [
      "Orange",
      "Sweet Lime (Mosambi)",
      "Banana",
      "Pomegranate",
      "Guava",
    ],
    crops: [
      "Cotton",
      "Soybean",
      "Sorghum (Jowar)",
      "Pigeon Pea (Tur)",
      "Wheat",
    ],
  },
  aurangabad: {
    district: "Aurangabad",
    center: [19.8762, 75.3433],
    fruits: ["Sweet Lime (Mosambi)", "Grapes", "Guava", "Mango"],
    crops: ["Cotton", "Maize", "Jowar", "Bajra", "Pulses", "Sugarcane"],
  },
  beed: {
    district: "Beed",
    center: [18.9894, 75.76],
    fruits: ["Custard Apple (Sitaphal)", "Sweet Lime", "Pomegranate", "Guava"],
    crops: [
      "Cotton",
      "Soybean",
      "Jowar",
      "Bajra",
      "Pigeon Pea (Tur)",
      "Sugarcane",
    ],
  },
  bhandara: {
    district: "Bhandara",
    center: [21.17, 79.65],
    fruits: ["Mango", "Guava", "Sapota (Chikoo)"],
    crops: ["Rice (Paddy)", "Pulses", "Wheat", "Linseed"],
  },
  buldhana: {
    district: "Buldhana",
    center: [20.5333, 76.1833],
    fruits: ["Custard Apple", "Guava", "Orange"],
    crops: ["Cotton", "Soybean", "Jowar", "Pulses", "Maize"],
  },
  chandrapur: {
    district: "Chandrapur",
    center: [19.95, 79.3],
    fruits: ["Mango", "Guava", "Sapota"],
    crops: ["Rice (Paddy)", "Soybean", "Cotton", "Pulses"],
  },
  dhule: {
    district: "Dhule",
    center: [20.902, 74.7774],
    fruits: ["Pomegranate", "Papaya"],
    crops: [
      "Cotton",
      "Bajra",
      "Jowar",
      "Groundnut",
      "Maize",
      "Soybean",
      "Wheat",
      "Gram",
      "Chilli",
    ],
  },
  gadchiroli: {
    district: "Gadchiroli",
    center: [19.6667, 80.0],
    fruits: ["Mango", "Guava"],
    crops: ["Rice (Paddy)", "Soybean", "Cotton", "Pulses"],
  },
  gondia: {
    district: "Gondia",
    center: [21.45, 80.2],
    fruits: ["Mango"],
    crops: ["Rice (Paddy)", "Pulses", "Wheat"],
  },
  hingoli: {
    district: "Hingoli",
    center: [19.7167, 77.15],
    fruits: ["Banana"],
    crops: ["Turmeric", "Soybean", "Cotton", "Jowar", "Pulses"],
  },
  jalgaon: {
    district: "Jalgaon",
    center: [21.0486, 75.7903],
    fruits: ["Banana", "Lime"],
    crops: ["Cotton", "Jowar", "Bajra", "Groundnut"],
  },
  jalna: {
    district: "Jalna",
    center: [19.8417, 75.8861],
    fruits: ["Sweet Lime (Mosambi)", "Orange"],
    crops: ["Cotton", "Jowar", "Bajra", "Maize", "Soybean"],
  },
  kolhapur: {
    district: "Kolhapur",
    center: [16.7, 74.2333],
    fruits: ["Banana", "Guava", "Mango", "Cashew"],
    crops: [
      "Sugarcane",
      "Rice (Paddy)",
      "Jowar",
      "Soybean",
      "Groundnut",
      "Jaggery",
    ],
  },
  latur: {
    district: "Latur",
    center: [18.4, 76.5833],
    fruits: ["Grapes", "Pomegranate"],
    crops: ["Soybean", "Pulses", "Jowar", "Sugarcane"],
  },
  mumbai_city: {
    district: "Mumbai City",
    center: [19.076, 72.8777],
    fruits: [],
    crops: [],
    note: "Urban - no significant agriculture",
  },
  mumbai_suburban: {
    district: "Mumbai Suburban",
    center: [19.033, 72.85],
    fruits: [],
    crops: [],
    note: "Urban - no significant agriculture",
  },
  nagpur: {
    district: "Nagpur",
    center: [21.1458, 79.0882],
    fruits: ["Orange", "Sweet Lime", "Guava"],
    crops: [
      "Cotton",
      "Soybean",
      "Rice (Paddy)",
      "Jowar",
      "Pigeon Pea (Tur)",
      "Wheat",
      "Chilli",
    ],
  },
  nanded: {
    district: "Nanded",
    center: [19.15, 77.3333],
    fruits: ["Banana", "Mango"],
    crops: ["Sugarcane", "Cotton", "Jowar", "Soybean", "Pulses", "Turmeric"],
  },
  nandurbar: {
    district: "Nandurbar",
    center: [21.3667, 74.25],
    fruits: ["Papaya", "Mango", "Pomegranate", "Banana", "Custard Apple"],
    crops: [
      "Chilli",
      "Cotton",
      "Jowar",
      "Bajra",
      "Maize",
      "Wheat",
      "Groundnut",
      "Soybean",
    ],
  },
  nashik: {
    district: "Nashik",
    center: [20.0, 73.7833],
    fruits: ["Grapes", "Pomegranate", "Guava"],
    crops: [
      "Onions",
      "Tomato",
      "Sugarcane",
      "Bajra",
      "Jowar",
      "Wheat",
      "Cotton",
    ],
  },
  osmanabad: {
    district: "Osmanabad",
    center: [18.1667, 76.05],
    fruits: ["Grapes", "Pomegranate"],
    crops: ["Pulses", "Jowar", "Soybean", "Sugarcane"],
  },
  palghar: {
    district: "Palghar",
    center: [19.6969, 72.7654],
    fruits: ["Sapota (Chikoo)", "Mango", "Cashew", "Coconut", "Banana"],
    crops: ["Rice (Paddy)", "Pulses", "Finger Millet (Nachni)"],
  },
  parbhani: {
    district: "Parbhani",
    center: [19.2667, 76.7833],
    fruits: ["Sweet Lime", "Mango", "Sapota"],
    crops: ["Cotton", "Sorghum (Jowar)", "Soybean", "Pulses", "Sugarcane"],
  },
  pune: {
    district: "Pune",
    center: [18.5204, 73.8567],
    fruits: ["Grapes", "Figs (Anjeer)", "Pomegranate"],
    crops: ["Sugarcane", "Onions", "Jowar", "Bajra", "Wheat", "Vegetables"],
  },
  raigad: {
    district: "Raigad",
    center: [18.75, 73.4167],
    fruits: ["Mango", "Cashew", "Coconut", "Sapota", "Arecanut"],
    crops: ["Rice (Paddy)", "Pulses", "Finger Millet (Nachni)"],
  },
  ratnagiri: {
    district: "Ratnagiri",
    center: [16.9944, 73.3],
    fruits: [
      "Alphonso Mango (Hapus)",
      "Cashew",
      "Coconut",
      "Jackfruit",
      "Kokum",
    ],
    crops: ["Rice (Paddy)", "Finger Millet (Nachni)", "Coconuts"],
  },
  sangli: {
    district: "Sangli",
    center: [16.8667, 74.5667],
    fruits: ["Grapes", "Pomegranate", "Banana"],
    crops: ["Sugarcane", "Turmeric", "Jowar", "Wheat"],
  },
  satara: {
    district: "Satara",
    center: [17.6833, 74.0],
    fruits: ["Strawberry", "Grapes"],
    crops: ["Sugarcane", "Jowar", "Turmeric", "Ginger", "Rice"],
  },
  sindhudurg: {
    district: "Sindhudurg",
    center: [16.17, 73.7],
    fruits: [
      "Mango",
      "Cashew",
      "Coconut",
      "Jackfruit",
      "Kokum",
      "Arecanut",
      "Sapota",
    ],
    crops: ["Rice (Paddy)", "Finger Millet", "Groundnut", "Pulses"],
  },
  solapur: {
    district: "Solapur",
    center: [17.6833, 75.9167],
    fruits: ["Pomegranate", "Grapes", "Ber (Indian Jujube)"],
    crops: ["Jowar", "Sugarcane", "Pigeon Pea (Tur)", "Gram"],
  },
  thane: {
    district: "Thane",
    center: [19.2183, 72.9781],
    fruits: ["Sapota (Chikoo)", "Mango", "Cashew", "Banana"],
    crops: ["Rice (Paddy)", "Pulses", "Finger Millet"],
  },
  wardha: {
    district: "Wardha",
    center: [20.75, 78.6167],
    fruits: ["Orange", "Sweet Lime"],
    crops: ["Cotton", "Soybean", "Pulses", "Jowar", "Turmeric"],
  },
  washim: {
    district: "Washim",
    center: [20.1, 77.15],
    fruits: ["Banana"],
    crops: ["Soybean", "Cotton", "Jowar", "Pulses", "Turmeric"],
  },
  yavatmal: {
    district: "Yavatmal",
    center: [20.4, 78.1333],
    fruits: ["Orange"],
    crops: ["Cotton", "Soybean", "Jowar", "Pulses"],
  },
};

// Create district lookup array
const DISTRICT_KEYS = Object.keys(DISTRICT_DATA);

// -------------------------
// Utility: normalize string
// -------------------------
function norm(s) {
  if (!s) return "";
  return String(s).toLowerCase().replace(/[.,]/g, "").trim();
}

// -------------------------
// ENHANCED: More specific restrictions
// -------------------------
const RESTRICTED_KEYWORDS = [
  // Urban infrastructure
  "hospital",
  "clinic",
  "school",
  "college",
  "university",
  "mall",
  "market",
  "hotel",
  "restaurant",
  "airport",
  "station",
  "railway",
  "bus stand",
  "bus stop",
  "police",
  "bank",
  "atm",
  "stadium",
  "library",
  "industrial",
  "factory",
  "commercial",
  "apartment",
  "apts",
  "office",
  "shop",
  "store",
  "cinema",
  "theatre",

  // Natural features where farming is impossible
  "lake",
  "pond",
  "river",
  "sea",
  "ocean",
  "water",
  "beach",
  "coast",
  "shore",
  "mountain",
  "peak",
  "hill",
  "cliff",
  "valley",
  "forest",
  "jungle",
  "wood",
  "park",

  // Transportation infrastructure
  "highway",
  "expressway",
  "road",
  "street",
  "avenue",
  "boulevard",
  "lane",
  "bridge",
  "tunnel",

  // Urban areas - major cities
  "mumbai",
  "pune",
  "nagpur",
  "thane",
  "nashik",
  "aurangabad",
  "solapur",
];

// Specific city center coordinates to restrict (used with smarter logic)
const CITY_CENTERS = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  nagpur: [21.1458, 79.0882],
  thane: [19.2183, 72.9781],
  nashik: [20.0, 73.7833],
  aurangabad: [19.8762, 75.3433],
  solapur: [17.6833, 75.9167],
};

// -------------------------
// SMART: Restriction detection
// Option 2 behaviour: city outskirts/open land allowed;
// but built/amenity/water/road features inside city => restricted
// -------------------------
function isLocationRestricted(
  address = {},
  displayName = "",
  lat,
  lon,
  osmClass = "",
  osmType = ""
) {
  // Build search text
  const searchText = [
    norm(displayName),
    norm(address.amenity),
    norm(address.building),
    norm(address.house_number),
    norm(address.road),
    norm(address.suburb),
    norm(address.neighbourhood),
    norm(address.village),
    norm(address.town),
    norm(address.city),
    norm(address.county),
    norm(address.state),
    norm(Object.values(address || {}).join(" ")),
  ].join(" ");

  // 1) direct keyword match — if any restricted keywords appear, mark restricted
  const hasRestrictedKeywords = RESTRICTED_KEYWORDS.some((k) =>
    searchText.includes(k)
  );
  if (hasRestrictedKeywords) return true;

  // 2) If OSM class/type indicates built/water/transportation features -> restricted
  // Osm classes like "amenity", "shop", "highway", "man_made", "railway", "aeroway", "leisure", "landuse"
  // Osm types that are explicit built/water features:
  const builtTypes = new Set([
    "hospital",
    "clinic",
    "school",
    "college",
    "university",
    "mall",
    "market",
    "hotel",
    "restaurant",
    "airport",
    "station",
    "bus_stop",
    "bus_station",
    "railway_station",
    "pier",
    "harbour",
    "dock",
    "runway",
    "terminal",
    "marina",
    "industrial",
    "commercial",
    "residential",
    "retail",
    "parking",
    "bridge",
    "tunnel",
    "aqueduct",
  ]);
  const waterTypes = new Set([
    "river",
    "stream",
    "lake",
    "pond",
    "reservoir",
    "water",
    "canal",
    "basin",
    "beach",
    "coast",
  ]);
  const highwayTypes = new Set([
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
    "residential",
    "service",
    "road",
    "footway",
    "path",
    "track",
  ]);

  const cls = String(osmClass || "").toLowerCase();
  const typ = String(osmType || "").toLowerCase();

  if (cls) {
    if (cls === "amenity" && builtTypes.has(typ)) return true;
    if (cls === "shop") return true;
    if (cls === "railway" || cls === "aeroway") return true;
    if (cls === "water" || waterTypes.has(typ)) return true;
    if (cls === "highway" && highwayTypes.has(typ)) {
      // highways & roads -> restricted
      return true;
    }
    if (
      cls === "man_made" &&
      (typ === "pier" || typ === "harbour" || typ === "pier")
    )
      return true;
    if (
      cls === "leisure" &&
      (typ === "stadium" || typ === "swimming_pool" || typ === "park")
    ) {
      // parks/large leisure maybe not farmland -> treat as restricted
      return true;
    }
    if (
      cls === "landuse" &&
      (typ === "industrial" ||
        typ === "commercial" ||
        typ === "residential" ||
        typ === "railway")
    ) {
      return true;
    }
  }

  // 3) City-center heuristic: if inside ~5km of a major city center AND the OSM result suggests a built feature (address has road/building/house_number/amenity)
  for (const [city, [cityLat, cityLon]] of Object.entries(CITY_CENTERS)) {
    const dLat = lat - cityLat;
    const dLon = lon - cityLon;
    const distance = Math.sqrt(dLat * dLat + dLon * dLon);
    if (distance < 0.045) {
      // approx 5 km
      // If address indicates a built-up spot (road/building/house_number/amenity), mark restricted.
      const hasBuiltAddressTag = !!(
        address &&
        (address.road ||
          address.building ||
          address.house_number ||
          address.amenity ||
          address.postcode)
      );
      if (hasBuiltAddressTag) return true;
      // If no built tags (open ground, field, village tag), allow crops (not restricted).
    }
  }

  // 4) If none of the above matched, treat as non-restricted (open/rural/fields are allowed)
  return false;
}

// -------------------------
// Coordinate-based district detection
// -------------------------
function detectDistrictByCoordinates(lat, lon) {
  // Maharashtra approximate bounds
  const MAHARASHTRA_BOUNDS = {
    north: 22.0284,
    south: 15.6029,
    west: 72.6594,
    east: 80.8909,
  };

  // Check if coordinates are within Maharashtra
  if (
    lat < MAHARASHTRA_BOUNDS.south ||
    lat > MAHARASHTRA_BOUNDS.north ||
    lon < MAHARASHTRA_BOUNDS.west ||
    lon > MAHARASHTRA_BOUNDS.east
  ) {
    return null;
  }

  // Find the closest district by coordinates
  let closestDistrict = null;
  let minDistance = Infinity;

  DISTRICT_KEYS.forEach((key) => {
    const district = DISTRICT_DATA[key];
    if (district.center) {
      const [districtLat, districtLon] = district.center;
      const distance = Math.sqrt(
        Math.pow(lat - districtLat, 2) + Math.pow(lon - districtLon, 2)
      );

      // If within reasonable distance (approx 100km), consider it
      if (distance < 1.0 && distance < minDistance) {
        minDistance = distance;
        closestDistrict = key;
      }
    }
  });

  return closestDistrict;
}

// -------------------------
// Enhanced district detection
// -------------------------
function detectDistrictFromAddress(address = {}, displayName = "", lat, lon) {
  if (!address && !displayName && (!lat || !lon)) return null;

  // Try coordinate-based detection first (most reliable for rural areas)
  const coordinateDistrict = detectDistrictByCoordinates(lat, lon);
  if (coordinateDistrict) {
    return coordinateDistrict;
  }

  // Fallback to address-based detection
  const searchText = [
    norm(displayName),
    norm(address.district),
    norm(address.county),
    norm(address.state_district),
    norm(address.region),
    norm(address.city),
    norm(address.town),
    norm(address.village),
    norm(address.hamlet),
    norm(Object.values(address).join(" ")),
  ].join(" ");

  // Direct matching with district names
  for (const districtKey of DISTRICT_KEYS) {
    const districtName = DISTRICT_DATA[districtKey].district.toLowerCase();

    if (
      searchText.includes(districtName) ||
      districtName.includes(searchText)
    ) {
      return districtKey;
    }
  }

  // Fuzzy matching for common variations
  const fuzzyMatches = {
    mumbai: "mumbai_city",
    bombay: "mumbai_city",
    suburban: "mumbai_suburban",
    thane: "thane",
    palghar: "palghar",
    nashik: "nashik",
    dhule: "dhule",
    nandurbar: "nandurbar",
    jalgaon: "jalgaon",
    ahmednagar: "ahmednagar",
    pune: "pune",
    solapur: "solapur",
    satara: "satara",
    sangli: "sangli",
    kolhapur: "kolhapur",
    nagpur: "nagpur",
    wardha: "wardha",
    bhandara: "bhandara",
    gondia: "gondia",
    gadchiroli: "gadchiroli",
    chandrapur: "chandrapur",
    yavatmal: "yavatmal",
    amravati: "amravati",
    akola: "akola",
    washim: "washim",
    buldhana: "buldhana",
    aurangabad: "aurangabad",
    jalna: "jalna",
    parbhani: "parbhani",
    hingoli: "hingoli",
    beed: "beed",
    latur: "latur",
    nanded: "nanded",
    osmanabad: "osmanabad",
    ratnagiri: "ratnagiri",
    sindhudurg: "sindhudurg",
    raigad: "raigad",
  };

  for (const [fuzzyName, districtKey] of Object.entries(fuzzyMatches)) {
    if (searchText.includes(fuzzyName)) {
      return districtKey;
    }
  }

  return null;
}

// -------------------------
// MapUpdater
// -------------------------
function MapUpdater({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.setView([lat, lon], 10, { animate: true });
  }, [lat, lon, map]);
  return null;
}

// -------------------------
// MapClickHandler with enhanced restriction detection
// -------------------------
function MapClickHandler({ onMapClick }) {
  useMapEvent("click", async (e) => {
    const { lat, lng } = e.latlng;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      const address = data.address || {};
      const display_name = data.display_name || "";
      const osmClass = data.class || data.osm_class || "";
      const osmType = data.type || data.osm_type || "";

      // Use enhanced restriction detection
      const isRestricted = isLocationRestricted(
        address,
        display_name,
        lat,
        lng,
        osmClass,
        osmType
      );

      onMapClick({
        lat,
        lon: lng,
        name: display_name || "Rural Farming Area",
        address,
        osmClass,
        osmType,
        isRestricted,
      });
    } catch (err) {
      onMapClick({
        lat,
        lon: lng,
        name: "Rural Farming Area",
        address: {},
        osmClass: "",
        osmType: "",
        isRestricted: false, // Default to allowing crops for unknown locations
      });
    }
  });
  return null;
}

// -------------------------
// StatCard
// -------------------------
function StatCard({ title, value, unit, emoji }) {
  return (
    <div className="stat-card">
      <div className="stat-emoji">{emoji}</div>
      <div className="stat-content">
        <div className="stat-value">
          {value}
          {unit && <span className="stat-unit">{unit}</span>}
        </div>
        <div className="stat-title">{title}</div>
      </div>
    </div>
  );
}

// Helper to get season
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return "Kharif";
  if (month >= 11 || month <= 3) return "Rabi";
  return "Zaid";
}

// Helper for UI
function getCropEmoji(type) {
  if (type === "fruit") return "🍎";
  if (type === "crop") return "🌾";
  return "🌱";
}

// -------------------------
// Main App
// -------------------------
export default function App() {
  // --- Authentication state ---
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agri_user") || "null");
    } catch {
      return null;
    }
  });
  const [showSignup, setShowSignup] = useState(false);

  function handleLoginSuccess(user) {
    localStorage.setItem("agri_user", JSON.stringify(user));
    setAuthUser(user);
  }

  function handleLogout() {
    localStorage.removeItem("agri_user");
    setAuthUser(null);
  }

  // --- State ---
  const [location, setLocation] = useState({
    lat: 20.9374, // Amravati coordinates
    lon: 77.7796,
    name: "Amravati, Maharashtra",
    address: {},
    isRestricted: false,
    osmClass: "",
    osmType: "",
  });

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suitableCrops, setSuitableCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectedDistrict, setDetectedDistrict] = useState(null);

  // --- State needed for UI ---
  const [showSmsCard, setShowSmsCard] = useState(false);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [smsMode, setSmsMode] = useState(null);

  // fetch weather
  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum,relative_humidity_2m_max&timezone=auto`
      );
      const result = await res.json();
      if (!result || !result.daily || !result.daily.time) {
        setData(null);
        return;
      }
      const chartData = result.daily.time.map((d, i) => ({
        date: d,
        temperature: result.daily.temperature_2m_max[i],
        humidity: result.daily.relative_humidity_2m_max[i],
        rainfall: result.daily.precipitation_sum[i],
      }));
      const latest = {
        temperature: result.daily.temperature_2m_max.at(-1),
        humidity: result.daily.relative_humidity_2m_max.at(-1),
        rainfall: result.daily.precipitation_sum.at(-1),
      };
      setData({ latest, history: chartData });
    } catch (err) {
      setError("Failed to fetch weather data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Main logic useEffect
  useEffect(() => {
    (async () => {
      const { lat, lon, name, address, isRestricted, osmClass, osmType } =
        location;
      if (!lat || !lon) return;

      // 1. Fetch weather for display
      await fetchWeather(lat, lon);

      // 2. ALWAYS try to detect district for any location
      const districtKey = detectDistrictFromAddress(address, name, lat, lon);
      setDetectedDistrict(districtKey);

      // 3. If restricted (smart check), show N/A crops but still show district if detected
      if (isRestricted) {
        setSuitableCrops([]);
        // notify user (optional)
        sendNotification(
          "🌍 Location: N/A",
          "Selected spot appears urban/non-farming — crops hidden."
        );
        return;
      }

      // 4. If not restricted: show crops from detected district or fallback
      if (districtKey) {
        const dData = DISTRICT_DATA[districtKey];
        if (dData) {
          // Transform district data into object array for UI
          const fruitsAsObjects = (dData.fruits || []).map((f) => ({
            name: f,
            type: "fruit",
            season: getCurrentSeason(),
            soil: "Loam to Clay Loam",
            fertilizers: ["Organic Manure", "NPK Fertilizer", "Micronutrients"],
            pesticides: ["Neem Oil", "Bio-pesticides"],
            schedule: ["Planting: June-July", "Harvest: Oct-Nov"],
          }));

          const cropsAsObjects = (dData.crops || []).map((c) => ({
            name: c,
            type: "crop",
            season: getCurrentSeason(),
            soil: "Well-drained Soil",
            fertilizers: ["Farm Yard Manure", "Urea", "DAP"],
            pesticides: ["Recommended Pesticides"],
            schedule: ["Sowing: Monsoon season", "Harvest: Winter"],
          }));

          setSuitableCrops([...fruitsAsObjects, ...cropsAsObjects]);

          // Notify user
          const notifyBody = `District: ${dData.district}\nFruits: ${
            dData.fruits.join(", ") || "N/A"
          }\nCrops: ${dData.crops.join(", ") || "N/A"}`;
          sendNotification(`🌾 ${dData.district}`, notifyBody);
          return;
        }
      }

      // 5. If district not found but location is not restricted, show default crops for Maharashtra
      setSuitableCrops([
        {
          name: "Soybean",
          type: "crop",
          season: getCurrentSeason(),
          soil: "Well-drained Loam",
          fertilizers: ["Farm Yard Manure", "Phosphatic Fertilizers"],
          pesticides: ["Neem-based Pesticides"],
          schedule: ["Sowing: June-July", "Harvest: Sep-Oct"],
        },
        {
          name: "Cotton",
          type: "crop",
          season: getCurrentSeason(),
          soil: "Black Cotton Soil",
          fertilizers: ["NPK Fertilizers", "Organic Compost"],
          pesticides: ["Integrated Pest Management"],
          schedule: ["Sowing: June", "Harvest: Nov-Dec"],
        },
        {
          name: "Jowar (Sorghum)",
          type: "crop",
          season: getCurrentSeason(),
          soil: "Medium to Heavy Soil",
          fertilizers: ["Nitrogen Fertilizers", "Farmyard Manure"],
          pesticides: ["Bio-pesticides"],
          schedule: ["Sowing: June-July", "Harvest: Oct-Nov"],
        },
      ]);

      sendNotification(
        "🌾 General Maharashtra",
        "Showing common crops for Maharashtra region"
      );
    })();
  }, [location, fetchWeather]);

  // Handle map click callback
  const handleMapClick = (loc) => {
    const next = {
      lat: loc.lat,
      lon: loc.lon,
      name: loc.name || "Rural Farming Area",
      address: loc.address || {},
      isRestricted: !!loc.isRestricted,
      osmClass: loc.osmClass || "",
      osmType: loc.osmType || "",
    };
    setLocation(next);
  };

  // handle search
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=1`
      );
      const result = await res.json();
      if (!result || !result.length) {
        setError("Location not found.");
        setSuitableCrops([]);
        setData(null);
        return;
      }
      const first = result[0];
      const address = first.address || {};
      const osmClass = first.class || first.osm_class || "";
      const osmType = first.type || first.osm_type || "";

      // Use enhanced restriction detection (smart)
      const isRestricted = isLocationRestricted(
        address,
        first.display_name,
        parseFloat(first.lat),
        parseFloat(first.lon),
        osmClass,
        osmType
      );

      setLocation({
        lat: parseFloat(first.lat),
        lon: parseFloat(first.lon),
        name: first.display_name || searchQuery,
        address,
        isRestricted,
        osmClass,
        osmType,
      });
    } catch (err) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  // use my location
  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
          );
          const data = await res.json();
          const address = data.address || {};
          const osmClass = data.class || data.osm_class || "";
          const osmType = data.type || data.osm_type || "";
          const isRestricted = isLocationRestricted(
            address,
            data.display_name,
            lat,
            lon,
            osmClass,
            osmType
          );

          setLocation({
            lat,
            lon,
            name: data.display_name || "My Location",
            address,
            isRestricted,
            osmClass,
            osmType,
          });
        } catch {
          setLocation({
            lat,
            lon,
            name: "My Location",
            address: {},
            isRestricted: false, // Default to allowing crops
            osmClass: "",
            osmType: "",
          });
        }
      },
      () => setError("Location access denied.")
    );
  }

  // Send SMS
  const handleSendSMS = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("❌ Enter a valid 10-digit Indian number");
      return;
    }

    const cropNames = suitableCrops.length
      ? suitableCrops.map((crop) => crop.name).join(", ")
      : "N/A";

    const cropInfo = `🌾 AgriSense (${location.name})\nCrops & Fruits: ${cropNames}`;

    setSending(true);
    try {
      const res = await fetch(
        "https://agrisense-17b.onrender.com/api/send-sms",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, cropInfo: cropInfo }),
        }
      );
      const result = await res.json();
      if (result.success) {
        alert("✅ SMS sent successfully!");
        setShowSmsCard(false);
        setPhone("");
        setSmsMode(null);
      } else {
        alert("❌ " + (result.error || "Failed to send SMS"));
      }
    } catch {
      alert("❌ Server error while sending SMS");
    } finally {
      setSending(false);
    }
  };

  if (!authUser) {
    return (
      <div>
        {showSignup ? (
          <Signup onLoginClick={() => setShowSignup(false)} />
        ) : (
          <Login
            onSignupClick={() => setShowSignup(true)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }
  const handleGeneratePDF = () => {
  if (location.isRestricted) {
    alert("❌ Cannot generate PDF for restricted/urban areas.");
    return;
  }

  if (!detectedDistrict || !suitableCrops.length) {
    alert("⚠️ Cannot generate PDF — incomplete farming data.");
    return;
  }

  const doc = new jsPDF();
  let y = 15;

  // Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AgriSense Farming Report", 10, y);
  y += 12;

  // Location
  doc.setFontSize(14);
  doc.text("Location:", 10, y);
  doc.setFont("Helvetica", "normal");
  doc.text(location.name, 45, y);
  y += 8;

  // District
  doc.setFont("Helvetica", "bold");
  doc.text("District:", 10, y);
  doc.setFont("Helvetica", "normal");
  doc.text(DISTRICT_DATA[detectedDistrict]?.district || "N/A", 45, y);
  y += 12;

  // Weather Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Weather Information", 10, y);
  y += 8;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  if (data?.latest) {
    doc.text(`• Temperature: ${data.latest.temperature}°C`, 10, y); y += 6;
    doc.text(`• Humidity: ${data.latest.humidity}%`, 10, y); y += 6;
    doc.text(`• Rainfall: ${data.latest.rainfall} mm`, 10, y); y += 10;
  } else {
    doc.text("No data available", 10, y); 
    y += 10;
  }

  // Crops
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Recommended Crops", 10, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");
  const cropList = suitableCrops.filter(c => c.type !== "fruit").map(c => c.name);

  if (cropList.length) {
    cropList.forEach(crop => {
      doc.text(`• ${crop}`, 10, y);
      y += 6;
    });
  } else {
    doc.text("N/A", 10, y);
  }
  y += 10;

  // Fruits
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Recommended Fruits", 10, y);
  y += 8;

  doc.setFontSize(12);
  const fruitList = suitableCrops.filter(c => c.type === "fruit").map(c => c.name);

  if (fruitList.length) {
    fruitList.forEach(fruit => {
      doc.text(`• ${fruit}`, 10, y);
      y += 6;
    });
  } else {
    doc.text("N/A", 10, y);
  }
  y += 10;

  // Fertilizers
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Fertilizer Recommendations", 10, y);
  y += 8;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  const fert = suitableCrops[0]?.fertilizers || [];
  fert.slice(0, 4).forEach(f => {
    doc.text(`• ${f}`, 10, y);
    y += 6;
  });
  y += 10;

  // Pest Management
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Pest Management", 10, y);
  y += 8;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  const pest = suitableCrops[0]?.pesticides || [];
  pest.slice(0, 4).forEach(p => {
    doc.text(`• ${p}`, 10, y);
    y += 6;
  });
  y += 10;

  // Suggestions
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Smart Farming Suggestions", 10, y);
  y += 8;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  const suggestions = [
    "• Use drip irrigation for water efficiency",
    "• Apply fertilizers after light rainfall",
    "• Keep soil moisture stable to avoid stress",
    "• Use mulching to reduce evaporation",
  ];
  suggestions.forEach(s => {
    doc.text(s, 10, y);
    y += 6;
  });

  // Save PDF
  doc.save("AgriSense_Report.pdf");
};


  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="brand-section">
              <div className="brand-logo">🌾</div>
              <h1 className="brand-title">AgriSense</h1>
            </div>

            <div className="search-section">
              <div className="search-box">
                <input
                  className="search-input"
                  placeholder="Search for farming area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button onClick={handleSearch} className="btn btn-primary">
                  🔍 Search
                </button>
              </div>
            </div>

            <div className="actions-section">
              <button onClick={useMyLocation} className="btn btn-secondary">
                📍 Use My Location
              </button>
              <button
                onClick={() => setShowAiModal(true)}
                className="btn btn-primary"
              >
                🤖 AI
              </button>
              <button
                onClick={() => setShowSmsCard(true)}
                className="btn btn-accent"
              >
                📩 Get Crop Info via SMS
              </button>
              <button onClick={handleGeneratePDF} className="btn btn-primary">
                📄 Get PDF
              </button>
              <button onClick={handleLogout} className="btn btn-outline">
                ⎋ Logout
              </button>
            </div>
          </div>
        </header>

        {/* Enhanced Location Info */}
        <div className="location-info">
          <div className="location-badge">
            <span className="location-icon">📍</span>
            <span className="location-text">{location.name}</span>
            {detectedDistrict && (
              <span className="valid-tag">
                📍 {DISTRICT_DATA[detectedDistrict]?.district}
              </span>
            )}
            {!detectedDistrict && !location.isRestricted && (
              <span className="valid-tag">🌾 Maharashtra Region</span>
            )}
            {!location.isRestricted ? (
              <span className="valid-tag">✅ Farming Area</span>
            ) : (
              <span className="invalid-tag">❌ Non-farming Zone</span>
            )}
          </div>

          {location.isRestricted && (
            <div className="location-warning">
              <span className="warning-icon">⚠️</span>
              This location appears to be urban or non-agricultural (city
              center, hospital, school, lake, mountain, road, etc.)
            </div>
          )}
        </div>

        {/* Loading Indicators */}
        {loading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            Loading weather data and location analysis...
          </div>
        )}

        {/* 📱 SMS Popup */}
        <AnimatePresence>
          {showSmsCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
            >
              <div className="modal-card">
                {!smsMode ? (
                  <>
                    <h3 className="modal-title">📱 Get Crop Info via SMS</h3>
                    <p className="modal-subtitle">Choose how to send SMS:</p>
                    <div className="modal-actions">
                      <button
                        onClick={() => setSmsMode("manual")}
                        className="btn btn-primary btn-large"
                      >
                        ✍️ Enter Number Manually
                      </button>
                      <button
                        onClick={() => {
                          setPhone(authUser?.phone || "");
                          setSmsMode("saved");
                        }}
                        className="btn btn-secondary btn-large"
                      >
                        📲 Use My Saved Number
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowSmsCard(false);
                        setSmsMode(null);
                        setPhone("");
                      }}
                      className="btn btn-text"
                    >
                      ❌ Cancel
                    </button>
                  </>
                ) : smsMode === "manual" ? (
                  <>
                    <h3 className="modal-title">📱 Enter Your Number</h3>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="modal-input"
                    />
                    <div className="modal-actions">
                      <button
                        onClick={handleSendSMS}
                        disabled={sending}
                        className="btn btn-primary btn-large"
                      >
                        {sending ? "Sending..." : "Send SMS"}
                      </button>
                    </div>
                    <button
                      onClick={() => setSmsMode(null)}
                      className="btn btn-text"
                    >
                      ← Back
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="modal-title">📱 Confirm Your Number</h3>
                    <p className="modal-phone">{phone}</p>
                    <div className="modal-actions">
                      <button
                        onClick={handleSendSMS}
                        disabled={sending}
                        className="btn btn-primary btn-large"
                      >
                        {sending ? "Sending..." : "Send SMS"}
                      </button>
                    </div>
                    <button
                      onClick={() => setSmsMode(null)}
                      className="btn btn-text"
                    >
                      ← Back
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🤖 AI Modal */}
        <AnimatePresence>
          {showAiModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
            >
              <div className="ai-modal">
                <div className="ai-modal-header">
                  <h3>🤖 AI Assistant</h3>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="btn btn-icon"
                  >
                    ✕
                  </button>
                </div>
                <iframe
                  src="https://gemini-ai-six-kappa.vercel.app/"
                  className="ai-iframe"
                  title="Gemini AI"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <div className="error-message">{error}</div>}

        {/* Main Content */}
        <main className="main-content">
          <div className="content-grid">
            {/* Left Column */}
            <div className="content-column">
              {/* Weather Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="card"
              >
                <div className="card-header">
                  <h2 className="card-title">7-Day Weather Forecast</h2>
                  <p className="card-subtitle">
                    Temperature · Humidity · Rainfall
                  </p>
                </div>
                <div className="chart-container">
                  {data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#ff6b35"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="humidity"
                          stroke="#4d8af0"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="rainfall"
                          stroke="#34c759"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data">
                      {!location.isRestricted
                        ? "Loading weather data..."
                        : "Weather data not available for non-farming areas"}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Map */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card"
              >
                <div className="card-header">
                  <h2 className="card-title">
                    Field Location Map
                    {!location.isRestricted ? " 🟢" : " 🔴"}
                  </h2>
                  <p className="card-subtitle">
                    Click anywhere on rural areas to get crop recommendations
                  </p>
                </div>
                <div className="map-container">
                  <MapContainer
                    center={[location.lat, location.lon]}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater lat={location.lat} lon={location.lon} />
                    <MapClickHandler onMapClick={handleMapClick} />
                    <Marker position={[location.lat, location.lon]}>
                      <Popup>
                        <div>
                          <strong>{location.name}</strong>
                          <br />
                          {detectedDistrict && (
                            <div>
                              District:{" "}
                              {DISTRICT_DATA[detectedDistrict]?.district}
                            </div>
                          )}
                          {!detectedDistrict && !location.isRestricted && (
                            <div>Region: Maharashtra</div>
                          )}
                          {!location.isRestricted
                            ? "✅ Valid Farming Area"
                            : "❌ Urban/Non-farming Zone"}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="sidebar">
              {/* Current Conditions */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Current Conditions</h2>
                </div>
                {data && !location.isRestricted ? (
                  <div className="stats-grid">
                    <StatCard
                      title="Temperature"
                      value={data.latest.temperature}
                      unit="°C"
                      emoji="🌡️"
                    />
                    <StatCard
                      title="Humidity"
                      value={data.latest.humidity}
                      unit="%"
                      emoji="💧"
                    />
                    <StatCard
                      title="Rainfall"
                      value={data.latest.rainfall}
                      unit="mm"
                      emoji="🌧️"
                    />
                  </div>
                ) : (
                  <div className="no-data">
                    {!location.isRestricted
                      ? "Fetching weather data..."
                      : "N/A - Urban/Non-farming area"}
                  </div>
                )}
              </div>

              {/* Suitable Crops - SHOW FOR NON-RESTRICTED AREAS */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">🌾 Crop Recommendations</h2>
                  {detectedDistrict && !location.isRestricted && (
                    <p className="card-subtitle">
                      Season: {getCurrentSeason()} •{" "}
                      {DISTRICT_DATA[detectedDistrict]?.district} District
                    </p>
                  )}
                  {!detectedDistrict && !location.isRestricted && (
                    <p className="card-subtitle">
                      Season: {getCurrentSeason()} • Maharashtra Region
                    </p>
                  )}
                </div>
                {!location.isRestricted && suitableCrops.length > 0 ? (
                  <div className="crop-categories">
                    {/* Show crops and fruits if available from district data */}
                    {suitableCrops.some((crop) => crop.type === "fruit") && (
                      <div className="crop-category">
                        <h3 className="category-title">Fruits</h3>
                        <div className="crops-list">
                          {suitableCrops
                            .filter((crop) => crop.type === "fruit")
                            .map((crop, i) => (
                              <div key={i} className="crop-item">
                                <div className="crop-name">{crop.name}</div>
                                <div className="crop-details">
                                  <span className="crop-season">
                                    {crop.season}
                                  </span>
                                  <span className="crop-soil">{crop.soil}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Crops List */}
                    <div className="crop-category">
                      <h3 className="category-title">Crops</h3>
                      <div className="crops-list">
                        {suitableCrops
                          .filter((crop) => crop.type !== "fruit")
                          .map((crop, i) => (
                            <div key={i} className="crop-item">
                              <div className="crop-name">{crop.name}</div>
                              <div className="crop-details">
                                <span className="crop-season">
                                  {crop.season}
                                </span>
                                <span className="crop-soil">{crop.soil}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    {location.isRestricted
                      ? "N/A - Urban/Non-farming Location"
                      : loading
                      ? "Analyzing location..."
                      : "Click on rural areas to select location"}
                  </div>
                )}
              </div>

              {/* Fertilizers & Pesticides */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">🧪 Farming Guide</h2>
                </div>
                {!location.isRestricted && suitableCrops.length > 0 ? (
                  <div className="recommendations-list">
                    {suitableCrops.slice(0, 3).map((crop, i) => (
                      <div
                        key={i}
                        className="recommendation-item enhanced ai-recommendation"
                      >
                        <h4 className="crop-name">
                          <span className="crop-emoji">
                            {getCropEmoji(crop.type)}
                          </span>
                          {crop.name}
                          <span className="crop-type-tag">{crop.type}</span>
                        </h4>
                        <div className="recommendation-details">
                          <div className="detail-group">
                            <span className="detail-label">
                              Recommended Fertilizers:
                            </span>
                            <div className="detail-values">
                              {crop.fertilizers &&
                                crop.fertilizers
                                  .slice(0, 3)
                                  .map((fert, idx) => (
                                    <span key={idx} className="detail-value">
                                      {fert}
                                    </span>
                                  ))}
                            </div>
                          </div>
                          <div className="detail-group">
                            <span className="detail-label">
                              Pest Management:
                            </span>
                            <div className="detail-values">
                              {crop.pesticides &&
                                crop.pesticides.slice(0, 2).map((pest, idx) => (
                                  <span key={idx} className="detail-value">
                                    {pest}
                                  </span>
                                ))}
                            </div>
                          </div>
                          {crop.schedule && (
                            <div className="detail-group">
                              <span className="detail-label">
                                Growing Schedule:
                              </span>
                              <div className="detail-values">
                                {crop.schedule.slice(0, 2).map((sch, idx) => (
                                  <span key={idx} className="detail-value">
                                    {sch}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    {location.isRestricted
                      ? "N/A - Urban/Non-farming Location"
                      : "Select a rural farming location"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>
            AgriSense © 2025 - Smart farming recommendations for Maharashtra
          </p>
        </footer>
      </div>
    </div>
  );
}
