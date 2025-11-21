// Weather data interface
export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  pressure: number;
  city: string;
}

// OpenWeather API key - Replace with your actual API key
const API_KEY = "9e3086bcb4341f0c41cfd47b8a658263";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Fetch weather data for a given latitude and longitude
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns Weather data object or null if fetch fails
 */
export const fetchWeather = async (
  lat: number,
  lon: number
): Promise<WeatherData | null> => {
  try {
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].main,
      icon: data.weather[0].icon,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      pressure: data.main.pressure,
      city: data.name,
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
};
