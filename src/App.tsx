import { useState, useEffect } from "react";
import { LatLng } from "leaflet";
import Map from "./Map";
import SearchBar from "./SearchBar";
import Weather from "./components/Weather";
import Translator from "./components/Translator";
import "./App.css";

import type { LatLngExpression } from "leaflet";
import type { WeatherData } from "./services/weatherService";
import { fetchWeather } from "./services/weatherService";

export interface Location {
  id: number;
  lat: number;
  lon: number;
  name: string;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags: {
    name?: string;
    [key: string]: string | undefined;
  };
}

function App() {
  const defaultPosition: LatLngExpression = [10.7769, 106.7009]; // HCMC

  // All the state now lives in App.tsx
  const [searchCenter, setSearchCenter] =
    useState<LatLngExpression>(defaultPosition);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeDestination, setRouteDestination] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(""); // ADD THIS
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);

  // Effect to get GPS location on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSearchCenter([latitude, longitude]); // This triggers the location search
      },
      (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        setSearchCenter(defaultPosition); // Triggers search at default
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  }, []); // Runs once on load

  // Effect to fetch locations when searchCenter changes
  useEffect(() => {
    // Type guard
    if (!Array.isArray(searchCenter)) return;

    const [lat, lng] = searchCenter;
    fetchLocations(lat, lng, searchQuery);
  }, [searchCenter, searchQuery]); // Runs every time searchCenter changes!

  // Effect to fetch weather when searchCenter changes
  useEffect(() => {
    if (!Array.isArray(searchCenter)) return;

    const [lat, lng] = searchCenter;
    const getWeather = async () => {
      setWeatherLoading(true);
      const weatherData = await fetchWeather(lat, lng);
      setWeather(weatherData);
      setWeatherLoading(false);
    };

    getWeather();
  }, [searchCenter]); // Fetch weather whenever location changes

  // The fetch function (moved from Map.tsx)
  // This version queries for food / coffee related POIs around the given point,
  // then randomly selects up to 5 locations client-side so results vary.
  const fetchLocations = async (lat: number, lng: number, query: string = "") => {
    setIsLoading(true);
    setLocations([]);

    const radius = 3000; // search within 3km by default

    // Vietnam bounding box: [south, west, north, east]
    const vietnamBbox = "8.5,102.0,23.5,109.5";

    // Helper: decode a few common HTML entities (in case input was encoded)
    const decodeEntities = (s: string) =>
      s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // Escape user input so it is safe inside Overpass / regex
    const escapeForOverpass = (s: string) => {
      const decoded = decodeEntities(s);
      // escape regex-special characters and quotes/backslashes
      return decoded.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&').replace(/\n/g, ' ').trim();
    };

    // Build Overpass query. If a free-text query is provided, search names;
    // otherwise search common food/coffee tags (restaurant, cafe, fast_food, shop=coffee, bakery, bar).
    let overpassQuery = `[out:json][bbox:${vietnamBbox}];(`;

    if (query.trim()) {
      const safeQuery = escapeForOverpass(query);
      overpassQuery += `
        node["name"~"${safeQuery}",i](around:${radius},${lat},${lng});
        way["name"~"${safeQuery}",i](around:${radius},${lat},${lng});
        relation["name"~"${safeQuery}",i](around:${radius},${lat},${lng});
      `;
    } else {
      // Food / coffee related tags
      overpassQuery += `
        node["amenity"="restaurant"](around:${radius},${lat},${lng});
        way["amenity"="restaurant"](around:${radius},${lat},${lng});
        relation["amenity"="restaurant"](around:${radius},${lat},${lng});

        node["amenity"="cafe"](around:${radius},${lat},${lng});
        way["amenity"="cafe"](around:${radius},${lat},${lng});
        relation["amenity"="cafe"](around:${radius},${lat},${lng});

        node["amenity"="fast_food"](around:${radius},${lat},${lng});
        way["amenity"="fast_food"](around:${radius},${lat},${lng});
        relation["amenity"="fast_food"](around:${radius},${lat},${lng});

        node["shop"="coffee"](around:${radius},${lat},${lng});
        way["shop"="coffee"](around:${radius},${lat},${lng});
        relation["shop"="coffee"](around:${radius},${lat},${lng});

        node["shop"="bakery"](around:${radius},${lat},${lng});
        way["shop"="bakery"](around:${radius},${lat},${lng});
        relation["shop"="bakery"](around:${radius},${lat},${lng});

        node["amenity"="bar"](around:${radius},${lat},${lng});
        way["amenity"="bar"](around:${radius},${lat},${lng});
        relation["amenity"="bar"](around:${radius},${lat},${lng});
      `;
    }

    overpassQuery += `); out center;`; // return center for ways/relations

    try {
      // Debug: log the query body to help diagnose server errors
      console.debug('Overpass query:', overpassQuery);
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          'Content-Type': 'text/plain'
        },
        body: overpassQuery,
      });
      // If Overpass returns an error page it will not be JSON — handle that and log body.
      if (!response.ok) {
        const text = await response.text();
        console.error('Overpass API error (status ' + response.status + '):', text);
        throw new Error('Overpass API error: ' + response.status);
      }
      const data = await response.json();

      if (!data.elements) {
        console.warn("No elements found");
        return;
      }

      // Filter elements with a name and that have coordinates
      const candidates: OverpassElement[] = data.elements.filter((el: OverpassElement) => {
        if (!el.tags || !el.tags.name) return false;
        // Ensure we have a usable coordinate
        const hasCoord = typeof el.lat === 'number' || (el.center && typeof el.center.lat === 'number');
        return hasCoord;
      });

      // Shuffle candidates (Fisher-Yates) and pick up to 5
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      const picked = candidates.slice(0, 5);

      const locationList: Location[] = picked.map((el: OverpassElement) => ({
        id: el.id,
        lat: el.lat ?? el.center!.lat,
        lon: el.lon ?? el.center!.lon,
        name: el.tags.name || "Location",
      }));

      setLocations(locationList);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers to pass down to children

  // For the SearchBar
  const handleSearch = (lat: number, lon: number, searchTerm: string = "") => {
    setSearchQuery(searchTerm);
    setSearchCenter([lat, lon]);
    // Immediately fetch locations for this search so results update right away
    fetchLocations(lat, lon, searchTerm);
  };

  // For the Map (clicking)
  const handleMapClick = (lat: number, lon: number) => {
    setSearchCenter([lat, lon]);
    setRouteDestination(null);
    // Fetch nearby POIs for the clicked location
    fetchLocations(lat, lon);
  };

  // Jump to user's current location (can be used by a UI button)
  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSearchCenter([latitude, longitude]);
        setRouteDestination(null);
        setSearchQuery("");
        fetchLocations(latitude, longitude);
      },
      (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        alert('Unable to retrieve your location');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  };

  const handleSetRoute = (location: Location) => {
    setRouteDestination(new LatLng(location.lat, location.lon));
  };

  return (
    <div className="App">
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      {/* Locate button: jump to user's current GPS location */}
      <button
        className="locate-btn"
        onClick={goToCurrentLocation}
        title="Go to current location"
        aria-label="Go to current location"
      >
        📍
      </button>
      <button
        className="translator-toggle-btn"
        onClick={() => setShowTranslator(true)}
        title="Open Translator"
        aria-label="Open Translator"
      >
        <img src="/translate.png" alt="Translator" />
      </button>
      <div className="main-content">
        <Map
          searchCenter={searchCenter}
          locations={locations}
          onLocationSelect={handleMapClick}
          // NEW: Pass down the new state and handler
          routeDestination={routeDestination}
          onSetRoute={handleSetRoute}
        />
        <Weather weather={weather} isLoading={weatherLoading} />
      </div>
      {showTranslator && <Translator onClose={() => setShowTranslator(false)} />}
    </div>
  );
}

export default App;
