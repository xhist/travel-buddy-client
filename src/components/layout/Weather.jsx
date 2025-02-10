import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const Weather = ({ destination }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (destination) {
      API.get(`/weather/${destination}`)
        .then((res) => setWeather(res.data))
        .catch((err) => console.error(err));
    }
  }, [destination]);

  if (!weather) return <p className="text-gray-600">Loading weather...</p>;

  return (
    <div className="p-4 border rounded shadow mb-4">
      <h3 className="text-xl font-bold mb-2">Weather Forecast</h3>
      <p className="text-gray-700">
        {weather.description} - {weather.temperature}°C
      </p>
    </div>
  );
};

export default Weather;
