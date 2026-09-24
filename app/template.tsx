'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Every navigation reveals the new page from the bottom up.
 *
 * A template remounts on each route change, unlike a layout, which is what
 * makes this the right place for it — the animation runs once per navigation
 * and never on a re-render within a page.
 *
 * The reveal is a clip-path wipe plus a short lift, not a translate of the
 * whole page. Sliding a full viewport height up would briefly make the
 * document taller than itself, which fights Lenis and flickers the scrollbar;
 * clipping changes nothing about layout and composites on the GPU. The lift is
 * small on purpose: past about 40px it stops reading as a page arriving and
 * starts reading as a page being thrown.
 *
 * Under prefers-reduced-motion there is no wipe at all. A page that erases
 * itself on every click is exactly what that setting exists to prevent.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(false);

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ clipPath: 'inset(100% 0 0 0)', y: 40 }}
      animate={{ clipPath: 'inset(0% 0 0 0)', y: 0 }}
      transition={{
        // The same easing family as the CSS tokens, so a page arriving feels
        // like the rest of the site rather than like a different library.
        ease: [0.16, 1, 0.3, 1],
        duration: 0.62,
        // The lift settles before the wipe finishes, so the page looks like it
        // is being uncovered rather than dragged.
        y: { duration: 0.5 },
      }}
      onAnimationComplete={() => setSettled(true)}
      // Dropped once the animation is done: a permanent will-change on a
      // full-page element keeps a compositor layer alive for the whole visit,
      // and this one wraps every route.
      style={settled ? undefined : { willChange: 'clip-path, transform' }}
    >
      {children}
    </motion.div>
  );
}
