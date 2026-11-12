const fetch = require('node-fetch');

const HEARTHIS_BASE_URL = 'https://hearthis.at';
const HEARTHIS_API_BASE_URL = 'https://api-v2.hearthis.at';

function decodeHtml(value) {
  if (!value) {
    return '';
  }

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value) {
  return decodeHtml((value || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractAttribute(block, attributeName) {
  const pattern = new RegExp(attributeName + '="([^"]*)"', 'i');
  const match = block.match(pattern);
  return match ? decodeHtml(match[1]) : '';
}

function extractText(block, pattern) {
  const match = block.match(pattern);
  return match ? stripTags(match[1]) : '';
}

function buildEmbedUrl(id) {
  return `${HEARTHIS_BASE_URL}/embed/${id}/transparent_black/?hcolor=55acee&color=&style=2&block_size=2&block_space=2&background=1&waveform=0&cover=0&autoplay=0&css=`;
}

function normalizeApiTrack(track, username) {
  const id = String(track.id || '');
  const title = track.title || track.caption || track.permalink || '';
  const streamUrl = track.stream_url || track.preview_url || '';

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    author: track.user && track.user.username ? track.user.username : username,
    coverUrl: track.artwork_url || track.thumb_hires || track.thumb || '',
    streamUrl,
    detailUrl: track.permalink_url || `${HEARTHIS_BASE_URL}/${encodeURIComponent(username)}/${track.permalink || ''}/`,
    embedUrl: buildEmbedUrl(id),
    durationSeconds: Number(track.duration || 0),
    plays: Number((track.counts && track.counts.plays) || track.playback_count || 0),
    category: track.genre || track.type || ''
  };
}

async function fetchApiTrackPage(username, page, count) {
  const url = `${HEARTHIS_API_BASE_URL}/${encodeURIComponent(username)}/?type=tracks&page=${page}&count=${count}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HearThis API tracks request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error('HearThis API tracks response was not a list.');
  }

  return payload;
}

async function fetchApiMixes(username) {
  const pageSize = 100;
  const mixes = [];
  const seenIds = new Set();

  for (let page = 1; page <= 20; page += 1) {
    const tracks = await fetchApiTrackPage(username, page, pageSize);

    if (!tracks.length) {
      break;
    }

    tracks
      .map(track => normalizeApiTrack(track, username))
      .filter(Boolean)
      .forEach(mix => {
        if (seenIds.has(mix.id)) {
          return;
        }

        seenIds.add(mix.id);
        mixes.push(mix);
      });

    if (tracks.length < pageSize) {
      break;
    }
  }

  return mixes;
}

function extractInternalId(profileHtml) {
  const match = profileHtml.match(/intInternalId\s*=\s*(\d+)\s*;/);

  if (!match) {
    throw new Error('Unable to extract HearThis internal user id.');
  }

  return match[1];
}

function extractFeaturedSoundId(profileHtml) {
  const match = profileHtml.match(/"featured_sound":"?(\d+)"?/);
  return match ? match[1] : '';
}

async function fetchProfileHtml(username) {
  const response = await fetch(`${HEARTHIS_BASE_URL}/${encodeURIComponent(username)}/`);

  if (!response.ok) {
    throw new Error(`HearThis profile request failed with status ${response.status}.`);
  }

  return response.text();
}

async function fetchMixMarkup(internalId, min, max) {
  const body = new URLSearchParams({
    user: String(internalId),
    min: String(min),
    max: String(max),
    start: '',
    end: '',
    tags: '',
    category: '',
    searchtext: ''
  });

  const response = await fetch(`${HEARTHIS_BASE_URL}/user_ajax_more.php`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`HearThis mixes request failed with status ${response.status}.`);
  }

  return response.text();
}

function parseMixes(markup) {
  const blocks = markup.match(/<li\b[^>]*data-option="user"[^>]*data-trackid="[^"]+"[\s\S]*?(?=<li\b[^>]*data-option="user"[^>]*data-trackid="|$)/g) || [];

  return blocks
    .map(block => {
      const id = extractAttribute(block, 'data-trackid');
      const title = extractAttribute(block, 'data-playlist-title');
      const coverUrl = extractAttribute(block, 'data-playlist-image');
      const streamUrl = extractAttribute(block, 'data-mp3');
      const detailPath = extractAttribute(block, 'data-detail') || extractAttribute(block, 'href');
      const durationSeconds = Number(extractAttribute(block, 'data-length') || 0);
      const plays = Number(extractText(block, /<span class="plays_count"[^>]*>([\s\S]*?)<\/span>/i) || 0);
      const category = extractText(block, /<i class="text-right[\s\S]*?<a[^>]*>([\s\S]*?)<\/a><\/i>/i);

      if (!id || !title || !streamUrl) {
        return null;
      }

      return {
        id,
        title,
        author: stripTags(extractAttribute(block, 'data-playlist-author')).replace(/^by\s+/i, ''),
        coverUrl,
        streamUrl,
        detailUrl: detailPath ? `${HEARTHIS_BASE_URL}${detailPath}` : '',
        embedUrl: buildEmbedUrl(id),
        durationSeconds,
        plays,
        category
      };
    })
    .filter(Boolean);
}

function parseFeaturedMix(profileHtml) {
  const blockMatch = profileHtml.match(/<li\b[^>]*data-option="highlight"[^>]*data-trackid="[^"]+"[\s\S]*?(?=<\/li>\s*<\/ul>)/i);

  if (!blockMatch) {
    return null;
  }

  const block = blockMatch[0];
  const id = extractAttribute(block, 'data-trackid');
  const title = extractAttribute(block, 'data-playlist-title');
  const coverUrl = extractAttribute(block, 'data-playlist-image');
  const streamUrl = extractAttribute(block, 'data-mp3');
  const detailPath = extractAttribute(block, 'data-detail') || extractAttribute(block, 'href');
  const durationSeconds = Number(extractAttribute(block, 'data-length') || 0);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    author: stripTags(extractAttribute(block, 'data-playlist-author')).replace(/^by\s+/i, ''),
    coverUrl,
    streamUrl,
    detailUrl: detailPath ? `${HEARTHIS_BASE_URL}${detailPath}` : '',
    embedUrl: buildEmbedUrl(id),
    durationSeconds,
    plays: 0,
    category: ''
  };
}

async function fetchHearthisMixes(username) {
  const apiMixes = await fetchApiMixes(username).catch(() => []);

  if (apiMixes.length) {
    return {
      username,
      internalId: '',
      count: apiMixes.length,
      mixes: apiMixes
    };
  }

  const profileHtml = await fetchProfileHtml(username);
  const internalId = extractInternalId(profileHtml);
  const featuredSoundId = extractFeaturedSoundId(profileHtml);
  const featuredMix = parseFeaturedMix(profileHtml);
  const mixes = [];
  const seenIds = new Set();

  if (featuredMix) {
    seenIds.add(featuredMix.id);
    mixes.push(featuredMix);
  }

  for (let min = 0; min <= 100; min += 10) {
    const markup = await fetchMixMarkup(internalId, min, min + 10);

    if (!markup.trim()) {
      break;
    }

    const pageMixes = parseMixes(markup).filter(mix => !seenIds.has(mix.id));

    if (!pageMixes.length) {
      break;
    }

    pageMixes.forEach(mix => {
      seenIds.add(mix.id);
      mixes.push(mix);
    });
  }

  if (featuredSoundId && !seenIds.has(featuredSoundId)) {
    const profileResponse = await fetch(`${HEARTHIS_API_BASE_URL}/${encodeURIComponent(username)}/`).catch(() => null);

    if (profileResponse && profileResponse.ok) {
      const profile = await profileResponse.json();

      if (String(profile.featured_sound || '') === String(featuredSoundId)) {
        mixes.unshift({
          id: featuredSoundId,
          title: 'Featured mix',
          author: username,
          coverUrl: '',
          streamUrl: '',
          detailUrl: `${HEARTHIS_BASE_URL}/${encodeURIComponent(username)}/`,
          embedUrl: buildEmbedUrl(featuredSoundId),
          durationSeconds: 0,
          plays: 0,
          category: ''
        });
        seenIds.add(featuredSoundId);
      }
    }
  }

  return {
    username,
    internalId,
    count: mixes.length,
    mixes
  };
}

module.exports = {
  fetchHearthisMixes
};
