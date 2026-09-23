'use client';

import { useState } from 'react';

/**
 * A YouTube embed that is not a YouTube embed until you click it.
 *
 * A real iframe costs roughly half a megabyte and several third-party requests
 * before anyone presses play. With a dozen models on a page that is the whole
 * performance budget spent on videos nobody watched. This renders the poster
 * frame — a plain image from i.ytimg.com — and swaps in the iframe on click,
 * autoplaying so the click still does what the viewer expected.
 */
export default function VideoFacade({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <style jsx>{`
          .video {
            position: relative;
            aspect-ratio: 16 / 9;
            background: #000;
          }
          iframe {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <button className="video" onClick={() => setPlaying(true)} type="button">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
        alt=""
        width={1280}
        height={720}
        loading="lazy"
      />
      <span className="play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="label">Play — {title}</span>

      <style jsx>{`
        .video {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          padding: 0;
          border: 0;
          background: #000;
          cursor: pointer;
          overflow: hidden;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.82;
          transition: opacity var(--dur) var(--ease-out), transform var(--dur-slow) var(--ease-out);
        }
        .video:hover img {
          opacity: 1;
          transform: scale(1.02);
        }
        .play {
          position: absolute;
          inset-block-start: 50%;
          inset-inline-start: 50%;
          translate: -50% -50%;
          display: grid;
          place-items: center;
          width: 4rem;
          height: 4rem;
          border-radius: 999px;
          background: var(--accent);
          color: var(--accent-ink);
          transition: transform var(--dur) var(--ease-out);
        }
        .video:hover .play {
          transform: scale(1.08);
        }
        .label {
          position: absolute;
          inset-block-end: 0;
          inset-inline: 0;
          padding: 2.5rem 1rem 0.9rem;
          text-align: start;
          font-family: var(--font-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
          background: linear-gradient(transparent, rgb(0 0 0 / 0.75));
        }
      `}</style>
    </button>
  );
}
