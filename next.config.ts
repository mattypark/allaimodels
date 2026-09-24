import type { NextConfig } from 'next';

const config: NextConfig = {
  // Formatted, readable HTML output — never minified markup.
  compress: true,

  images: {
    // Founder portraits and lab logos are fetched from their source domains and
    // recorded with a credit line in the data. Remote patterns stay explicit.
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default config;
