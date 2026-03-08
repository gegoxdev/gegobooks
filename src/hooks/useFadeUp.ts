import { useEffect, useRef } from 'react';

const ANIM_CLASSES = '.fade-up, .fade-left, .fade-right, .scale-up, .blur-in';

export const useFadeUp = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const el = ref.current;
    if (el) {
      const elements = el.querySelectorAll(ANIM_CLASSES);
      elements.forEach((element) => observer.observe(element));
    }

    return () => observer.disconnect();
  }, []);

  return ref;
};
