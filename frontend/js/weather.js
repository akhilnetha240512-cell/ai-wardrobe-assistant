/**
 * 100% Free Open-Meteo Weather Integration (No API key needed)
 */
export async function getLocalWeather() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ temp: 25, condition: "Pleasant" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          const data = await res.json();
          resolve({ temp: Math.round(data.current_weather.temperature), condition: "Clear" });
        } catch {
          resolve({ temp: 24, condition: "Clear" });
        }
      },
      () => resolve({ temp: 25, condition: "Clear" }),
      { timeout: 4000 }
    );
  });
}
