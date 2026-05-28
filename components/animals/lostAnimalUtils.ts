import { withListImageCacheBust } from '@/components/forum/forumUtils';
import { getApiBaseUrl } from '@/services/authApi';
import { eventImageSource } from '@/utils/eventImage';
import { formatBrazilPhoneInput } from '@/utils/phoneMask';

export type UploadImageResponse = { id: string; publicUrl: string; path: string };

export type LostAnimalDto = {
  id: string;
  hostId: string;
  userId?: string | null;
  animalName?: string | null;
  species: string;
  breed?: string | null;
  missingDate: string;
  missingLocation: string;
  description: string;
  contact: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  forumPostId?: string | null;
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
  author?: { id: string; name: string | null; photoUrl: string | null };
};

export type LostAnimalFormState = {
  animalName: string;
  species: string;
  breed: string;
  missingLocation: string;
  missingDate: string;
  description: string;
  contact: string;
};

export const EMPTY_LOST_ANIMAL_FORM: LostAnimalFormState = {
  animalName: '',
  species: '',
  breed: '',
  missingLocation: '',
  missingDate: '',
  description: '',
  contact: '',
};

function readString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}

function rewriteLocalhostMediaUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return url;
    const base = new URL(getApiBaseUrl());
    return `${base.origin}${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

function resolveLostAnimalMediaFields(raw: Record<string, unknown>): {
  mediaId: string | null;
  imageUrl: string | null;
} {
  const nested = raw.media ?? raw.image ?? raw.file;
  let mediaId = readString(raw.mediaId ?? raw.media_id);
  let imageUrl = readString(
    raw.imageUrl ?? raw.image_url ?? raw.photoUrl ?? raw.photo_url,
  );

  if (nested && typeof nested === 'object') {
    const m = nested as Record<string, unknown>;
    mediaId = mediaId ?? readString(m.id ?? m.mediaId ?? m.media_id);
    imageUrl =
      imageUrl ??
      readString(m.publicUrl ?? m.public_url ?? m.url) ??
      readString(m.path);
  }

  const forumPost = raw.forumPost ?? raw.forum_post;
  if (forumPost && typeof forumPost === 'object') {
    const fp = forumPost as Record<string, unknown>;
    mediaId = mediaId ?? readString(fp.mediaId ?? fp.media_id);
    imageUrl = imageUrl ?? readString(fp.imageUrl ?? fp.image_url);
  }

  return { mediaId, imageUrl };
}

export function normalizeLostAnimalDto(raw: unknown): LostAnimalDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = readString(r.id);
  if (!id) return null;

  const { mediaId, imageUrl } = resolveLostAnimalMediaFields(r);
  const authorRaw = r.author ?? r.user;
  let author: LostAnimalDto['author'];
  if (authorRaw && typeof authorRaw === 'object') {
    const a = authorRaw as Record<string, unknown>;
    const authorId = readString(a.id ?? a.userId ?? a.user_id);
    if (authorId) {
      author = {
        id: authorId,
        name: readString(a.name),
        photoUrl: readString(a.photoUrl ?? a.photo_url),
      };
    }
  }

  return {
    id,
    hostId: readString(r.hostId ?? r.host_id) ?? '',
    userId: readString(r.userId ?? r.user_id),
    animalName: readString(r.animalName ?? r.animal_name),
    species: readString(r.species) ?? '',
    breed: readString(r.breed),
    missingDate: readString(r.missingDate ?? r.missing_date) ?? '',
    missingLocation: readString(r.missingLocation ?? r.missing_location) ?? '',
    description: readString(r.description) ?? '',
    contact: readString(r.contact) ?? '',
    mediaId,
    imageUrl,
    createdAt: readString(r.createdAt ?? r.created_at) ?? undefined,
    updatedAt: readString(r.updatedAt ?? r.updated_at) ?? undefined,
    forumPostId: readString(r.forumPostId ?? r.forum_post_id),
    likesCount: readNumber(r.likesCount ?? r.likes_count),
    commentsCount: readNumber(r.commentsCount ?? r.comments_count),
    liked: readBoolean(r.liked),
    author,
  };
}

export function normalizeLostAnimalList(data: unknown): LostAnimalDto[] {
  let rows: unknown[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) rows = o.data;
    else if (Array.isArray(o.items)) rows = o.items;
    else if (Array.isArray(o.content)) rows = o.content;
  }
  return rows
    .map((row) => normalizeLostAnimalDto(row))
    .filter((item): item is LostAnimalDto => item != null);
}

export function lostAnimalImageUrl(item: Pick<LostAnimalDto, 'imageUrl' | 'mediaId'>): string | null {
  const mediaId = item.mediaId?.trim();
  if (mediaId) {
    return `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(mediaId)}`;
  }

  const direct = item.imageUrl?.trim();
  if (!direct) return null;

  if (direct.startsWith('http://') || direct.startsWith('https://')) {
    return rewriteLocalhostMediaUrl(direct);
  }
  if (direct.startsWith('/')) {
    return `${getApiBaseUrl()}${direct}`;
  }
  return direct;
}

export function lostAnimalImageSource(
  item: Pick<LostAnimalDto, 'imageUrl' | 'mediaId'>,
  imageCacheEpoch: number,
) {
  const url = lostAnimalImageUrl(item);
  if (!url) return null;
  const busted = withListImageCacheBust(url, imageCacheEpoch);
  return eventImageSource(busted);
}

export const FOUND_ANIMAL_PREFIX = '✅ ANIMAL ENCONTRADO — ';

export function isLostAnimalOwner(
  item: Pick<LostAnimalDto, 'userId' | 'author'>,
  userId?: string | null,
): boolean {
  const uid = userId?.trim();
  if (!uid) return false;
  return item.userId === uid || item.author?.id === uid;
}

export function isDescriptionMarkedFound(description: string): boolean {
  const d = description.trim().toUpperCase();
  return d.startsWith('✅ ANIMAL ENCONTRADO') || d.includes('ANIMAL ENCONTRADO —');
}

export function isLostAnimalMarkedFound(item: Pick<LostAnimalDto, 'description'>): boolean {
  return isDescriptionMarkedFound(item.description ?? '');
}

export function markDescriptionAsFound(description: string): string {
  const d = description.trim();
  if (isDescriptionMarkedFound(d)) return d;
  const stripped = stripFoundPrefix(d);
  return `${FOUND_ANIMAL_PREFIX}${stripped}`;
}

export function stripFoundPrefix(description: string): string {
  const d = description.trim();
  if (d.startsWith(FOUND_ANIMAL_PREFIX)) return d.slice(FOUND_ANIMAL_PREFIX.length).trim();
  if (d.toUpperCase().startsWith('✅ ANIMAL ENCONTRADO')) {
    const idx = d.indexOf('—');
    if (idx >= 0) return d.slice(idx + 1).trim();
  }
  return d;
}

export function lostAnimalDtoToFormState(item: LostAnimalDto): LostAnimalFormState {
  return {
    animalName: item.animalName?.trim() ?? '',
    species: item.species?.trim() ?? '',
    breed: item.breed?.trim() ?? '',
    missingLocation: item.missingLocation?.trim() ?? '',
    missingDate: isoDateToBrazil(item.missingDate),
    description: stripFoundPrefix(item.description ?? ''),
    contact: formatContactDisplay(item.contact) || item.contact?.trim() || '',
  };
}

export function formatMissingDateLabel(
  missingDate: string,
  createdAt?: string,
): string {
  const raw = missingDate?.trim();
  if (raw) {
    const br = isoDateToBrazil(raw);
    if (br && /^\d{2}\/\d{2}\/\d{4}$/.test(br)) return br;
    return raw;
  }
  const d = createdAt ? new Date(createdAt) : new Date('');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export function lostAnimalTitle(item: Pick<LostAnimalDto, 'animalName' | 'species' | 'breed'>): string {
  const name = item.animalName?.trim();
  if (name) return name;
  const species = item.species?.trim();
  if (species) {
    const breed = item.breed?.trim() ? ` (${item.breed.trim()})` : '';
    return `${species}${breed}`;
  }
  return 'Animal perdido';
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  const d = new Date(`${value.trim()}T12:00:00`);
  return !Number.isNaN(d.getTime());
}


export function formatBrazilDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}


export function brazilDateToIso(brDate: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(brDate.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo}-${d}`;
  if (!isValidIsoDate(iso)) return null;
  const parsed = new Date(`${iso}T12:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed.getTime() > today.getTime()) return null;
  return iso;
}

export function isoDateToBrazil(iso: string): string {
  const raw = iso?.trim();
  if (!raw) return '';
  const datePart = raw.includes('T') ? raw.split('T')[0] ?? raw : raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y}`;
  }
  return raw;
}

export function formatContactInput(raw: string): string {
  if (raw.includes('@')) return raw;
  return formatBrazilPhoneInput(raw);
}

export function formatContactDisplay(contact: string): string {
  const t = contact.trim();
  if (!t) return '';
  if (t.includes('@')) return t;
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 10) return formatBrazilPhoneInput(digits);
  return t;
}

export type LostAnimalFormErrors = Partial<Record<keyof LostAnimalFormState | 'photo', string>>;

export function hasFormErrors(errors: LostAnimalFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function validateLostAnimalForm(
  form: LostAnimalFormState,
  hasPhoto: boolean,
  options?: { requirePhoto?: boolean },
): LostAnimalFormErrors {
  const errors: LostAnimalFormErrors = {};
  const requirePhoto = options?.requirePhoto !== false;

  if (requirePhoto && !hasPhoto) errors.photo = 'Selecione uma foto do animal.';
  if (!form.species.trim()) errors.species = 'Informe a espécie.';
  if (!form.missingLocation.trim()) {
    errors.missingLocation = 'Informe o local onde foi visto ou perdido.';
  }
  if (!form.missingDate.trim()) {
    errors.missingDate = 'Informe a data do desaparecimento.';
  } else if (!brazilDateToIso(form.missingDate)) {
    errors.missingDate = 'Data inválida. Use DD/MM/AAAA (ex.: 20/05/2026).';
  }
  if (!form.description.trim()) {
    errors.description = 'Informe a descrição.';
  } else if (form.description.trim().length < 10) {
    errors.description = 'A descrição deve ter pelo menos 10 caracteres.';
  }

  const contact = form.contact.trim();
  if (!contact) {
    errors.contact = 'Informe telefone ou e-mail de contato.';
  } else if (contact.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      errors.contact = 'Informe um e-mail válido.';
    }
  } else {
    const digits = contact.replace(/\D/g, '');
    if (digits.length < 10) {
      errors.contact = 'Informe um telefone válido com DDD (ex.: (11) 99999-9999).';
    }
  }

  return errors;
}

export function matchesLostAnimalSearch(item: LostAnimalDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    item.animalName,
    item.species,
    item.breed,
    item.missingLocation,
    item.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return parts.includes(q);
}

export function sortLostAnimals(
  items: LostAnimalDto[],
  sort: 'recent' | 'oldest',
): LostAnimalDto[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sort === 'recent' ? tb - ta : ta - tb;
  });
  return copy;
}

export function hasActiveLostAnimalFilters(filters: {
  species: string;
  breed: string;
  location: string;
}): boolean {
  return !!(filters.species.trim() || filters.breed.trim() || filters.location.trim());
}

export function prepareLostAnimalFormForApi(
  form: LostAnimalFormState,
): LostAnimalFormState | null {
  const iso = brazilDateToIso(form.missingDate);
  if (!iso) return null;
  const contact = form.contact.trim();
  const contactForApi = contact.includes('@')
    ? contact
    : formatBrazilPhoneInput(contact.replace(/\D/g, ''));
  return {
    ...form,
    animalName: form.animalName.trim(),
    species: form.species.trim(),
    breed: form.breed.trim(),
    missingLocation: form.missingLocation.trim(),
    missingDate: iso,
    description: form.description.trim(),
    contact: contactForApi,
  };
}
