import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll both window and any scrollable containers to top on route change
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Also scroll the main content container if it's a custom scroll div
        const mainContent = document.querySelector('main')
            || document.querySelector('[data-scroll-container]')
            || document.querySelector('.main-content')
            || document.querySelector('.dashboard-content')
            || document.getElementById('main-scroll');

        if (mainContent) {
            mainContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        // Also scroll the root div
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return null;
};
