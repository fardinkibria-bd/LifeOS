import { useEffect, useRef, useState } from 'react';
interface Props {
  onComplete: () => void;
}

/** Branded LifeOS boot sequence; kept local so no vendor wordmark can flash. */
export function IntroAnimation({ onComplete }: Props) {
  const completeRef = useRef(onComplete);
  const [wordmark, setWordmark] = useState('');
  const fullWordmark = 'LifeOS';

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let characterIndex = 0;
    const typeTimer = window.setInterval(() => {
      characterIndex += 1;
      setWordmark(fullWordmark.slice(0, characterIndex));
      if (characterIndex === fullWordmark.length) window.clearInterval(typeTimer);
    }, reducedMotion ? 1 : 130);
    const timer = window.setTimeout(() => completeRef.current(), reducedMotion ? 250 : 2600);
    return () => {
      window.clearInterval(typeTimer);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="lifeos-authored-intro fixed inset-0 z-[9999] flex items-center justify-center" role="status" aria-label="Loading LifeOS">
      <div className="lifeos-intro-mark">
        <div className="lifeos-intro-logo" aria-hidden="true">
          <img
            src="/Logo(croped).png"
            alt=""
            className="h-full w-full rounded-[20px] object-cover"
            draggable={false}
          />
        </div>
        <div className="lifeos-intro-wordmark" aria-label={fullWordmark}>
          {wordmark}
          <span className="lifeos-intro-caret" aria-hidden="true" />
        </div>
        <div className="lifeos-intro-status">
          <span className="lifeos-intro-dot" aria-hidden="true" />
          Organizing your life
        </div>
      </div>
    </div>
  );
}
