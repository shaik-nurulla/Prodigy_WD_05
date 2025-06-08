// Weather code to emoji and description mapping
const weatherCodes = {
    0: { emoji: '☀️', description: 'Clear sky' },
    1: { emoji: '🌤️', description: 'Mainly clear' },
    2: { emoji: '⛅', description: 'Partly cloudy' },
    3: { emoji: '☁️', description: 'Overcast' },
    45: { emoji: '🌫️', description: 'Fog' },
    48: { emoji: '🌫️', description: 'Depositing rime fog' },
    51: { emoji: '🌦️', description: 'Light drizzle' },
    53: { emoji: '🌦️', description: 'Moderate drizzle' },
    55: { emoji: '🌦️', description: 'Dense drizzle' },
    56: { emoji: '🌦️', description: 'Light freezing drizzle' },
    57: { emoji: '🌦️', description: 'Dense freezing drizzle' },
    61: { emoji: '🌧️', description: 'Slight rain' },
    63: { emoji: '🌧️', description: 'Moderate rain' },
    65: { emoji: '🌧️', description: 'Heavy rain' },
    66: { emoji: '🌧️', description: 'Light freezing rain' },
    67: { emoji: '🌧️', description: 'Heavy freezing rain' },
    71: { emoji: '🌨️', description: 'Slight snow fall' },
    73: { emoji: '🌨️', description: 'Moderate snow fall' },
    75: { emoji: '🌨️', description: 'Heavy snow fall' },
    77: { emoji: '🌨️', description: 'Snow grains' },
    80: { emoji: '🌦️', description: 'Slight rain showers' },
    81: { emoji: '🌦️', description: 'Moderate rain showers' },
    82: { emoji: '🌦️', description: 'Violent rain showers' },
    85: { emoji: '🌨️', description: 'Slight snow showers' },
    86: { emoji: '🌨️', description: 'Heavy snow showers' },
    95: { emoji: '⛈️', description: 'Thunderstorm' },
    96: { emoji: '⛈️', description: 'Thunderstorm with slight hail' },
    99: { emoji: '⛈️', description: 'Thunderstorm with heavy hail' }
};

// DOM elements
const weatherForm = document.getElementById('weather-form');
const locationInput = document.getElementById('location-input');
const currentLocationBtn = document.getElementById('current-location-btn');
const loading = document.getElementById('loading');
const weatherResult = document.getElementById('weather-result');
const errorResult = document.getElementById('error-result');

// Weather display elements
const locationName = document.getElementById('location-name');
const currentTime = document.getElementById('current-time');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weather-condition');
const weatherEmoji = document.getElementById('weather-emoji');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const errorMessage = document.getElementById('error-message');

// Event listeners
weatherForm.addEventListener('submit', handleFormSubmit);
currentLocationBtn.addEventListener('submit', getCurrentLocation);

async function handleFormSubmit(e) {
    e.preventDefault();
    const location = locationInput.value.trim();
    if (location) {
        await getWeatherByLocation(location);
    }
}

async function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                hideLoading();
                showError('Unable to get your location. Please enter a city name manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

async function getWeatherByLocation(location) {
    try {
        showLoading();
        
        // First, get coordinates for the location using a geocoding service
        const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error('Location not found. Please check the spelling and try again.');
        }
        
        const { latitude, longitude, name, country } = geocodeData.results[0];
        await getWeatherByCoordinates(latitude, longitude, `${name}, ${country}`);
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function getWeatherByCoordinates(lat, lon, locationDisplayName = null) {
    try {
        // Get weather data from Open-Meteo API
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,visibility&timezone=auto`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const weatherData = await weatherResponse.json();
        
        // If no location name provided, try to get it from reverse geocoding
        if (!locationDisplayName) {
            try {
                const reverseGeocodeResponse = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
                );
                const reverseGeocodeData = await reverseGeocodeResponse.json();
                if (reverseGeocodeData.results && reverseGeocodeData.results.length > 0) {
                    const { name, country } = reverseGeocodeData.results[0];
                    locationDisplayName = `${name}, ${country}`;
                } else {
                    locationDisplayName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                }
            } catch {
                locationDisplayName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            }
        }
        
        displayWeather(weatherData, locationDisplayName);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

function displayWeather(data, location) {
    const current = data.current;
    const weatherCode = current.weather_code;
    const weatherInfo = weatherCodes[weatherCode] || { emoji: '🌤️', description: 'Unknown' };
    
    // Update location and time
    locationName.textContent = location;
    currentTime.textContent = new Date().toLocaleString();
    
    // Update current weather
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    weatherCondition.textContent = weatherInfo.description;
    weatherEmoji.textContent = weatherInfo.emoji;
    
    // Update weather details
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;
    visibility.textContent = `${Math.round(current.visibility / 1000)} km`;
    
    // Show weather result
    weatherResult.style.display = 'block';
    errorResult.style.display = 'none';
}

function showLoading() {
    loading.style.display = 'block';
    weatherResult.style.display = 'none';
    errorResult.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorResult.style.display = 'block';
    weatherResult.style.display = 'none';
}

// Load default weather for a popular city on page load
window.addEventListener('load', () => {
    getWeatherByLocation('London');
});