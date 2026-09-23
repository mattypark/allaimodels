import { getJson } from '../lib/fetch.ts';
import type { SourceResult } from '../lib/types.ts';

type OEmbed = { title: string; author_name: string; thumbnail_url: string };

/**
 * Resolves launch-video IDs already present in the data to their real titles.
 *
 * oEmbed is public and keyless, which is the whole reason this project needs
 * no API keys. It cannot *find* a video — only confirm one — so a missing
 * launch video stays missing until a human supplies the URL. Guessing a video
 * id would attach the wrong launch to a model, which is worse than a gap.
 */
export async function scrapeYouTube(ids: { lab: string; modelId: string; youtubeId: string }[]): Promise<SourceResult> {
  const findings = [];
  const notes: string[] = [];

  if (ids.length === 0) {
    return { source: 'youtube-oembed', ok: true, findings: [], notes: ['no videos in the dataset to verify'] };
  }

  for (const { lab, modelId, youtubeId } of ids) {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
    const res = await getJson<OEmbed>(url);
    if (!res.ok) {
      notes.push(`${lab}/${modelId}: video ${youtubeId} did not resolve (${res.reason})`);
      continue;
    }
    findings.push({
      lab,
      modelId,
      field: 'video.title',
      value: res.data.title,
      sourceUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    });
  }

  return { source: 'youtube-oembed', ok: true, findings, notes };
}
