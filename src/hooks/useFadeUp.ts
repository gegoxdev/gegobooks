import { useEffect, useRef } from 'react';

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
      { threshold: 0.1 }
    );

    const el = ref.current;
    if (el) {
      const fadeElements = el.querySelectorAll('.fade-up');
      fadeElements.forEach((element) => observer.observe(element));
    }

    return () => observer.disconnect();
  }, []);

  return ref;
};
