import { useState, useEffect } from "react";
import { LatLng } from "leaflet";
import Map from "./Map";
import SearchBar from "./SearchBar";
import "./App.css";

import type { LatLngExpression } from "leaflet";

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

  // The fetch function (moved from Map.tsx)
  const fetchLocations = async (lat: number, lng: number, query: string = "") => {
    setIsLoading(true);
    setLocations([]);

    const radius = 5000; // Increased radius to find more results
    
    // Vietnam bounding box: [south, west, north, east]
    const vietnamBbox = "8.5,102.0,23.5,109.5";
    
    let overpassQuery = `[out:json][bbox:${vietnamBbox}];(`;
    
    if (query.trim()) {
      // Search for specific keyword - using multiple tags
      overpassQuery += `
      node["name"~"${query}","i"](around:${radius},${lat},${lng});
      way["name"~"${query}","i"](around:${radius},${lat},${lng});
      relation["name"~"${query}","i"](around:${radius},${lat},${lng});
    `;
    } else {
      // Default: search tourism + amenity + shop locations
      overpassQuery += `
        node["tourism"](around:${radius},${lat},${lng});
        way["tourism"](around:${radius},${lat},${lng});
        relation["tourism"](around:${radius},${lat},${lng});
        node["amenity"](around:${radius},${lat},${lng});
        way["amenity"](around:${radius},${lat},${lng});
        node["shop"](around:${radius},${lat},${lng});
        way["shop"](around:${radius},${lat},${lng});
      `;
    }
    
    overpassQuery += `); out center 5;`; // Return up to 5 results

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
      });
      const data = await response.json();
      
      if (!data.elements) {
        console.warn("No elements found");
        return;
      }
      
      const locationList: Location[] = data.elements
        .filter((el: OverpassElement) => el.tags.name) // Filter out items without names
        .map((el: OverpassElement) => ({
          id: el.id,
          lat: el.lat || el.center!.lat,
          lon: el.lon || el.center!.lon,
          name: el.tags.name || "Location",
        }))
        .slice(0, 5); // Strictly limit to 5 results
    
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
  };

  // For the Map (clicking)
  const handleMapClick = (lat: number, lon: number) => {
    setSearchCenter([lat, lon]);
    setRouteDestination(null);
  };

  const handleSetRoute = (location: Location) => {
    setRouteDestination(new LatLng(location.lat, location.lon));
  };

  return (
    <div className="App">
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      <Map
        searchCenter={searchCenter}
        locations={locations}
        onLocationSelect={handleMapClick}
        // NEW: Pass down the new state and handler
        routeDestination={routeDestination}
        onSetRoute={handleSetRoute}
      />
    </div>
  );
}

export default App;
