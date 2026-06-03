import type { PontoInteresse } from '@/types';

type OsmRef = { type: 'node' | 'way' | 'relation'; id: number };

export type PlacePhotoLookup = {
  placeId: string;
  name?: string;
};

const photoCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const OVERPASS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json',
  'User-Agent': 'RotaApp/1.0',
};

function cacheKey(placeId: string, name?: string): string {
  const n = name?.trim();
  return n ? `${placeId}|${n}` : placeId;
}

function parseOsmRef(placeId: string): OsmRef | null {
  const match = placeId.trim().match(/^(node|way|relation)\/(\d+)$/i);
  if (!match) return null;
  return {
    type: match[1].toLowerCase() as OsmRef['type'],
    id: Number(match[2]),
  };
}

function commonsFileUrl(fileName: string): string {
  const clean = fileName.replace(/^file:/i, '').trim();
  if (!clean) return '';
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=480`;
}

function photoUrlFromOsmTagsSync(tags: Record<string, string>): string | null {
  const direct = tags.image?.trim() || tags['image:url']?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;

  const mapillary = tags.mapillary?.trim();
  if (mapillary && /^https?:\/\//i.test(mapillary)) return mapillary;

  const commons =
    tags.wikimedia_commons?.trim() ||
    tags['brand:wikimedia_commons']?.trim() ||
    tags['wikimedia_commons:file']?.trim();

  if (commons && !/^category:/i.test(commons)) {
    const url = commonsFileUrl(commons);
    return url || null;
  }

  return null;
}

async function fetchWikidataImage(qid: string): Promise<string | null> {
  const id = qid.trim().toUpperCase();
  if (!/^Q\d+$/.test(id)) return null;

  try {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      entities?: Record<string, { claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> } }>;
    };
    const fileName = json.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (typeof fileName !== 'string' || !fileName.trim()) return null;
    const url = commonsFileUrl(fileName);
    return url || null;
  } catch {
    return null;
  }
}

async function fetchWikipediaThumbnailFromTag(tag: string): Promise<string | null> {
  const trimmed = tag.trim();
  if (!trimmed) return null;

  const colon = trimmed.indexOf(':');
  const lang = colon > 0 ? trimmed.slice(0, colon).trim() : 'pt';
  const title = colon > 0 ? trimmed.slice(colon + 1).trim() : trimmed;
  if (!title) return null;

  try {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('titles', title);
    url.searchParams.set('prop', 'pageimages');
    url.searchParams.set('piprop', 'thumbnail');
    url.searchParams.set('pithumbsize', '480');
    url.searchParams.set('origin', '*');

    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    };
    const pages = json.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages)) {
      const src = page.thumbnail?.source?.trim();
      if (src) return src;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWikipediaSearchThumbnail(searchTerm: string): Promise<string | null> {
  const term = searchTerm.trim();
  if (!term) return null;

  for (const lang of ['pt', 'en'] as const) {
    try {
      const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
      url.searchParams.set('action', 'query');
      url.searchParams.set('format', 'json');
      url.searchParams.set('generator', 'search');
      url.searchParams.set('gssearch', term);
      url.searchParams.set('gslimit', '1');
      url.searchParams.set('prop', 'pageimages');
      url.searchParams.set('piprop', 'thumbnail');
      url.searchParams.set('pithumbsize', '480');
      url.searchParams.set('origin', '*');

      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
      };
      const pages = json.query?.pages;
      if (!pages) continue;
      for (const page of Object.values(pages)) {
        const src = page.thumbnail?.source?.trim();
        if (src) return src;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function photoUrlFromOsmTagsAsync(
  tags: Record<string, string>,
  options?: { name?: string; allowNameSearch?: boolean },
): Promise<string | null> {
  const sync = photoUrlFromOsmTagsSync(tags);
  if (sync) return sync;

  const wikidataId =
    tags.wikidata?.trim() || tags['brand:wikidata']?.trim() || tags['operator:wikidata']?.trim();
  if (wikidataId) {
    const fromWikidata = await fetchWikidataImage(wikidataId);
    if (fromWikidata) return fromWikidata;
  }

  const wikipediaTag =
    tags.wikipedia?.trim() ||
    tags['brand:wikipedia']?.trim() ||
    tags['operator:wikipedia']?.trim();
  if (wikipediaTag) {
    const fromWiki = await fetchWikipediaThumbnailFromTag(wikipediaTag);
    if (fromWiki) return fromWiki;
  }

  if (options?.allowNameSearch && options.name?.trim()) {
    return fetchWikipediaSearchThumbnail(options.name);
  }

  return null;
}

async function requestOsmTagMaps(osmRefs: OsmRef[]): Promise<Map<string, Record<string, string>>> {
  const result = new Map<string, Record<string, string>>();
  if (osmRefs.length === 0) return result;

  const body = `[out:json][timeout:25];(${osmRefs
    .map((r) => `${r.type}(${r.id});`)
    .join('')});out tags;`;
  const payload = `data=${encodeURIComponent(body)}`;

  for (const overpassUrl of OVERPASS_URLS) {
    try {
      const res = await fetch(overpassUrl, {
        method: 'POST',
        headers: OVERPASS_HEADERS,
        body: payload,
      });
      if (!res.ok) continue;

      const json = (await res.json()) as {
        elements?: Array<{ type: string; id: number; tags?: Record<string, string> }>;
      };

      for (const el of json.elements ?? []) {
        const key = `${el.type}/${el.id}`;
        result.set(key, el.tags ?? {});
      }
      if (result.size > 0) return result;
    } catch {
      continue;
    }
  }

  return result;
}

async function resolveFromOsmRef(
  osmRef: OsmRef,
  options?: { name?: string; allowNameSearch?: boolean },
): Promise<string | null> {
  const key = `${osmRef.type}/${osmRef.id}`;
  const tagMaps = await requestOsmTagMaps([osmRef]);
  const tags = tagMaps.get(key);
  if (!tags) return null;
  return photoUrlFromOsmTagsAsync(tags, options);
}

export async function resolvePlacePhotoUrl(
  placeId: string,
  options?: { name?: string },
): Promise<string | null> {
  const trimmed = placeId.trim();
  if (!trimmed) return null;

  const key = cacheKey(trimmed, options?.name);
  if (photoCache.has(key)) {
    return photoCache.get(key) ?? null;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const osmRef = parseOsmRef(trimmed);
    let url: string | null = null;

    try {
      if (osmRef) {
        url = await resolveFromOsmRef(osmRef, {
          name: options?.name,
          allowNameSearch: true,
        });
      } else if (options?.name?.trim()) {
        url = await fetchWikipediaSearchThumbnail(options.name);
      }
    } catch {
      url = null;
    }

    photoCache.set(key, url);
    photoCache.set(trimmed, url);
    return url;
  })();

  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

async function resolvePhotosForPontos(
  pontos: PontoInteresse[],
  options?: { allowNameSearch?: boolean },
): Promise<PontoInteresse[]> {
  const needsLookup = pontos.filter((p) => !p.photoUrl?.trim() && parseOsmRef(p.id));
  if (needsLookup.length === 0) return pontos;

  const osmRefs = needsLookup
    .map((p) => parseOsmRef(p.id))
    .filter((r): r is OsmRef => r != null);

  const uniqueRefs = Array.from(
    new Map(osmRefs.map((r) => [`${r.type}/${r.id}`, r] as const)).values(),
  );

  let tagByOsmId = new Map<string, Record<string, string>>();
  try {
    tagByOsmId = await requestOsmTagMaps(uniqueRefs);
  } catch {
    return pontos;
  }

  const photoByOsmId = new Map<string, string | null>();
  await Promise.all(
    Array.from(tagByOsmId.entries()).map(async ([osmKey, tags]) => {
      const ponto = needsLookup.find((p) => p.id === osmKey);
      const url = await photoUrlFromOsmTagsAsync(tags, {
        name: ponto?.titulo,
        allowNameSearch: options?.allowNameSearch ?? false,
      });
      photoByOsmId.set(osmKey, url);
      photoCache.set(osmKey, url);
    }),
  );

  return pontos.map((ponto) => {
    if (ponto.photoUrl?.trim()) return ponto;
    const url = photoByOsmId.get(ponto.id) ?? photoCache.get(ponto.id) ?? null;
    if (!url) return ponto;
    return { ...ponto, photoUrl: url };
  });
}

export async function enrichPontosWithPhotos(pontos: PontoInteresse[]): Promise<PontoInteresse[]> {
  return resolvePhotosForPontos(pontos, { allowNameSearch: false });
}

export function mergePontoPhotoUpdate(
  current: PontoInteresse | null,
  enrichedList: PontoInteresse[],
): PontoInteresse | null {
  if (!current) return current;
  const updated = enrichedList.find((p) => p.id === current.id);
  if (!updated?.photoUrl?.trim()) return current;
  if (current.photoUrl?.trim() === updated.photoUrl.trim()) return current;
  return { ...current, photoUrl: updated.photoUrl };
}
