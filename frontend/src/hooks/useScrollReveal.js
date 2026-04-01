import { useEffect, useRef } from "react";

/**
 * Scroll-reveal hook using IntersectionObserver.
 * Add className="reveal" (or "reveal-left", "reveal-right", "reveal-scale")
 * to any element, then pass the container ref to this hook.
 *
 * @param {number} threshold - 0–1, how much of element must be visible
 */
export default function useScrollReveal(threshold = 0.12) {
    const containerRef = useRef(null);

    useEffect(() => {
        const root = containerRef.current || document;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold }
        );

        const observeElements = (node) => {
            const elements = node.querySelectorAll
                ? node.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
                : [];
            elements.forEach((el) => observer.observe(el));
        };

        // Initial observation
        observeElements(root);

        // Watch for new elements
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && node.matches(".reveal, .reveal-left, .reveal-right, .reveal-scale")) {
                            observer.observe(node);
                        }
                        observeElements(node);
                    }
                });
            });
        });

        mutationObserver.observe(root, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, [threshold]);

    return containerRef;
}
