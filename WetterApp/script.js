// -----------------------------
// URLs für die verwendeten APIs
// -----------------------------

// Geocoding API (Nominatim)
const geocodingApiUrl = "https://nominatim.openstreetmap.org/search?format=json&q=";
const geocodingCityPlzApiUrl = "https://nominatim.openstreetmap.org/search?format=json";
// Beispiel:
// https://nominatim.openstreetmap.org/search?format=json&q=Berlin

// Wetter API (Open-Meteo)
const weatherApiUrl = "https://api.open-meteo.com/v1/forecast?current_weather=true&";
// Beispiel (Koordinaten für Berlin):
// https://api.open-meteo.com/v1/forecast?current_weather=true&latitude=52.52&longitude=13.41


// -------------------------------------------------------------
// Klassen für strukturierte Datenspeicherung (OOP-Anforderung)
// -------------------------------------------------------------

// Klasse für Wetterdaten
class WeatherData {
    // TODO Klasse für Wetterdaten
    constructor(name, latitude, longitude, temperature, weatherCode, time) {
        this.name = name ?? "–"; // Anzeigename des Orts
        this.latitude = parseFloat(latitude); // Breitengrad
        this.longitude = parseFloat(longitude); //Längengrad
        this.temperature = parseFloat(temperature); //Temperatur
        this.weatherCode = parseInt(weatherCode); //Wettercode
        this.time = time ?? null; //Zeit
    }

    // Formatiert die Temperatur auf ganze Zahl und hängt "°C" an --> Ausgabe ist dann z.B. "20 °C"
    get formattedTemperature() {
        if (isNaN(this.temperature)) {
            return "– °C";
        } else {
            return `${Math.round(this.temperature)} °C`; // Rundet auf ganze Zahl
        }
    }

}

// Klasse für Ortsdaten (z. B. aus Nominatim)
class LocationData {
    // TODO Klasse für Ortsdaten
    constructor(latitude, longitude, displayName) {
        this.latitude = parseFloat(latitude); //Breitengrad
        this.longitude = parseFloat(longitude); //Längengrad
        this.displayName = displayName; // Vollständiger Ortsname aus API (z. B. „Linz, Oberösterreich, Österreich“)
    }
}

// -----------------------------
// Holt die Elemente aus HTML
// -----------------------------
// Holt Referenzen auf die HTML-Eingabefelder per ID
const cityInput = document.getElementById("cityInput");
const zipInput = document.getElementById("zipInput");



// -----------------------------
// Hauptfunktion: Suche starten
// -----------------------------
async function searchWeather() {
    const city = cityInput.value; // Eingegebene Stadt
    const plz = zipInput.value; // Eingegebene PLZ
    try {
        // Koordinaten aus dem jeweiligen Ort abrufen
        const locationData = await getCoordinates(city, plz);   // Ortsdaten abfragen
        // Wetterdaten mit diesen Koordinaten abrufen
        const weatherData = await fetchWeatherData(locationData);   // Wetterdaten abfragen
        updateWeatherData(weatherData);  // Wetterdaten anzeigen
    } catch (error) {
        // Wenn ein Fehler auftritt
        console.error("Fehler beim Abfragen des Wetters: ", error);
        // TODO Fehler auf Webseite anzeigen
        const errorElement = document.getElementById("error");
        errorElement.textContent = "Fehler beim Abfragen des Wetters: " + error.message;
        errorElement.classList.remove("hidden");
        document.getElementById("weather-result").classList.add("hidden"); //blendet Wetteranzeige wenn vorhanden aus --> wenn Fehler auftritt
    }

    // Felder leeren
    cityInput.value = "";
    zipInput.value = "";
}


// -----------------------------
// Anzeige der Wetterdaten im HTML
// -----------------------------
function updateWeatherData(weatherData) {
    // TODO Wetterdaten auf Webseite anzeigen

    const weatherContainer = document.getElementById("weather-result");
    const placeElement = document.getElementById("place-name");
    const tempElement = document.getElementById("temperature");
    const descElement = document.getElementById("weather-desc");
    const iconElement = document.getElementById("weather-icon");

    // Beschreibung/Icon anhand des Wettercodes bestimmen
    const description = getWeatherDescription(weatherData.weatherCode);
    const iconHtml = getWeatherIcon(weatherData.weatherCode);

    // Werte ins HTML geben
    placeElement.innerHTML = weatherData.name;
    tempElement.innerHTML = weatherData.formattedTemperature;
    descElement.innerHTML = description;
    iconElement.innerHTML = iconHtml;

    // Ergebnis anzeigen
    weatherContainer.classList.remove("hidden");

}


// -----------------------------
// Ortsdaten abrufen
// -----------------------------
async function getCoordinates(city, zip) {
    // TODO Ortsdaten mittels fetch abfragen

    // Meldung falls Nutzer nichts eingibt
    if (!city && !zip) {
        throw new Error("Bitte gib PLZ und/oder Ort ein!")
    }

    // URL für die API zusammenstellen
    // → "limit=1" begrenzt das Ergebnis auf einen Treffer
    // → "countrycodes=at,de,ch" filtert auf deutschsprachige Länder
    let url = geocodingCityPlzApiUrl + "&addressdetails=1&limit=1&countrycodes=at,de,ch&";
    if (zip && city) {
        // Wenn PLZ und Stadt eingegeben wurden
        url += `postalcode=${encodeURIComponent(zip)}&city=${encodeURIComponent(city)}`;
    } else if (zip) {
        // Wenn nur PLZ eingegeben wurde
        url += `postalcode=${encodeURIComponent(zip)}`;
    } else {
        // Wenn nur Stadt eingegeben wurde
        url += `q=${encodeURIComponent(city)}`;
    }

    // Anfrage an API senden
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("Ortssuche fehlgeschlagen!")
    }

    // Antwort in JSON umwandeln
    const data = await response.json();
    if (data.length === 0) {
        throw new Error("Kein Ort gefunden.");
    }

    // Suche nach exakter PLZ und Stadt
    let result = data.find(item => {
        const address = item.address || {};

        // stimmt PLZ überein --> ohne Leerzeichen
        const plzMatch = zip ? (address.postcode && address.postcode.replace(/\s/g, "") === zip.replace(/\s/g, "")) : true;

        // stimmt Stadtname überein
        const cityNames = [address.city, address.town, address.village, address.municipality].filter(Boolean);
        const cityMatch = city ? cityNames.some(c => c.toLowerCase().replace(/\s/g, "") === city.toLowerCase().replace(/\s/g, "")) : true;
        return plzMatch && cityMatch;
    });

    // Wenn keine exakte Übereinstimmung gefunden wurde --> Fehlermeldung
    if (!result) {
        throw new Error("PLZ und Ort stimmen nicht exakt überein.");
    }

    // Koordinaten/Anzeigename zurückgeben
    return new LocationData(result.lat, result.lon, result.display_name);
}


// -----------------------------
// Wetterdaten über Open-Meteo abrufen
// -----------------------------
async function fetchWeatherData(locationData) {
    // TODO Wetterdaten für den gegebenen Ort mittels fetch abfragen

    const { latitude, longitude, displayName } = locationData;

    // URL zusammenstellen
    const url = `${weatherApiUrl}latitude=${latitude}&longitude=${longitude}&timezone=auto`;

    //Anfrage an WetterAPI senden
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Wetterdaten.");
    }

    //Antwort umwandeln in JSON
    const data = await response.json();
    if (!data.current_weather) {
        throw new Error("Keine aktuellen Wetterdaten gefunden.");
    }

    //relevante Wetterdaten asulesen
    const weather = data.current_weather;

    // als Objekt von WeatherData zurückgeben
    return new WeatherData(
        displayName,
        latitude,
        longitude,
        weather.temperature,
        weather.weathercode,
        weather.time
    );

}

// Abfrage des Wettericons zu einem Wettercode
function getWeatherIcon(weathercode) {
    let iconName;
    switch (weathercode) {
        case 0:
            iconName = "clear-day.svg";
            break;
        case 1:
        case 2:
        case 3:
            iconName = "partly-cloudy-day.svg";
            break;
        case 45:
        case 48:
            iconName = "fog.svg";
            break;
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
        case 80:
        case 81:
        case 82:
            iconName = "rain.svg";
            break;
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
            iconName = "snow.svg";
            break;
        case 95:
        case 96:
        case 99:
            iconName = "thunderstorms.svg";
            break;
        default:
            iconName = "unknown.svg"; // Füge ein Icon für unbekannte Wettercodes hinzu
    }
    return `<img src="icons/${iconName}" alt="Wetter Icon">`;
}

// Abfrage der Wetterbeschreibung zu einem Wettercode
function getWeatherDescription(weathercode) {
    const weatherDescriptions = {
        0: "Klarer Himmel",
        1: "Leicht bewölkt",
        2: "Teilweise bewölkt",
        3: "Bewölkt",
        45: "Nebel",
        48: "Ablagerungsnebel",
        51: "Leichter Nieselregen",
        53: "Mäßiger Nieselregen",
        55: "Starker Nieselregen",
        56: "Leichter gefrierender Nieselregen",
        57: "Starker gefrierender Nieselregen",
        61: "Leichter Regen",
        63: "Mäßiger Regen",
        65: "Starker Regen",
        66: "Leichter gefrierender Regen",
        67: "Starker gefrierender Regen",
        71: "Leichter Schneefall",
        73: "Mäßiger Schneefall",
        75: "Starker Schneefall",
        77: "Schneeregen",
        80: "Leichte Regenschauer",
        81: "Mäßige Regenschauer",
        82: "Starke Regenschauer",
        85: "Leichte Schneeschauer",
        86: "Starke Schneeschauer",
        95: "Gewitter",
        96: "Gewitter mit Hagel",
        99: "Gewitter mit starkem Hagel"
    };
    return weatherDescriptions[weathercode] || "Unbekannt";
}


// -----------------------------
// Event-Listener für Formular-Absenden
// -----------------------------
document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Verhindert das Neuladen der Seite beim Absenden des Formulars

    // Alte Fehlermeldung ausblenden
    const err = document.getElementById("error");
    err.textContent = "";
    err.classList.add("hidden");

    //Hauptfunktion starten
    searchWeather();
});