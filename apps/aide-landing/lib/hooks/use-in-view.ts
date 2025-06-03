import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions extends IntersectionObserverInit {
	triggerOnce?: boolean;
}

export function useInView(options: UseInViewOptions = {}) {
	const [inView, setInView] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					if (options.triggerOnce) {
						observer.disconnect();
					}
				} else if (!options.triggerOnce) {
					setInView(false);
				}
			},
			{
				threshold: options.threshold || 0.1,
				root: options.root,
				rootMargin: options.rootMargin,
			}
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => observer.disconnect();
	}, [options.threshold, options.triggerOnce, options.root, options.rootMargin]);

	return [ref, inView] as const;
}
