export type CurrentWeather = {
  temperature: number;
  precipitationProbability: number;
};

type OpenMeteoCurrentResponse = {
  current?: {
    temperature_2m?: number;
    precipitation_probability?: number;
  };
};

export async function getCurrentWeather(params: {
  lat: number;
  lon: number;
}): Promise<CurrentWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(params.lat));
  url.searchParams.set('longitude', String(params.lon));
  url.searchParams.set('current', 'temperature_2m,precipitation_probability');
  url.searchParams.set('timezone', 'America/Sao_Paulo');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `open-meteo failed (${res.status})`);
  }

  const data = (await res.json()) as OpenMeteoCurrentResponse;
  const temperature = data.current?.temperature_2m;
  const precipitationProbability = data.current?.precipitation_probability;

  if (!Number.isFinite(temperature) || !Number.isFinite(precipitationProbability)) {
    throw new Error('open-meteo response missing current weather');
  }

  return {
    temperature: temperature as number,
    precipitationProbability: precipitationProbability as number,
  };
}
