import type { WeatherData } from "../services/weatherService";
import "./Weather.css";

type WeatherProps = {
  weather: WeatherData | null;
  isLoading: boolean;
};

function Weather({ weather, isLoading }: WeatherProps) {
  if (isLoading) {
    return <div className="weather-container loading">Loading weather...</div>;
  }

  if (!weather) {
    return <div className="weather-container">Weather data unavailable</div>;
  }

  // OpenWeatherMap icon URL
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="weather-container">
      <div className="weather-header">
        <h3>{weather.city}</h3>
        <span className="weather-description">{weather.description}</span>
      </div>

      <div className="weather-main">
        <img src={iconUrl} alt={weather.description} className="weather-icon" />
        <div className="temperature-section">
          <span className="temperature">{weather.temp}°C</span>
          <span className="feels-like">Feels like {weather.feelsLike}°C</span>
        </div>
      </div>

      <div className="weather-details">
        <div className="weather-item">
          <span className="label">Humidity</span>
          <span className="value">{weather.humidity}%</span>
        </div>
        <div className="weather-item">
          <span className="label">Wind Speed</span>
          <span className="value">{weather.windSpeed} km/h</span>
        </div>
        <div className="weather-item">
          <span className="label">Pressure</span>
          <span className="value">{weather.pressure} hPa</span>
        </div>
      </div>
    </div>
  );
}

export default Weather;
