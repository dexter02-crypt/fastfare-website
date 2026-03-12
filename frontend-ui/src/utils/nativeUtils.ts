/**
 * Native Utility layer — Browser APIs with future Capacitor support
 * 
 * Fixes 7, 8, 9:
 *  - GPS geolocation (browser navigator.geolocation)
 *  - Camera availability check  
 *  - Background Socket reconnection (visibilitychange listener)
 * 
 * NOTE: Capacitor native plugins are NOT installed yet. When you add
 * @capacitor/geolocation, @capacitor/camera, @capacitor/app to the project,
 * uncomment the Capacitor sections below. For now, browser APIs are used.
 */

// ─── GEOLOCATION ─────────────────────────────────────
export interface GeoPosition {
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
}

/**
 * Get current GPS position using browser geolocation.
 */
export const getCurrentPosition = (): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation not supported'));
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
                timestamp: pos.timestamp,
            }),
            reject,
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
    });
};

/**
 * Watch GPS position using browser watchPosition.
 * Returns a cleanup function.
 */
export const watchPosition = (
    onUpdate: (pos: GeoPosition) => void,
    onError?: (err: GeolocationPositionError) => void
): (() => void) => {
    if (!navigator.geolocation) return () => { };

    const id = navigator.geolocation.watchPosition(
        (pos) => onUpdate({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
        }),
        onError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(id);
};


// ─── CAMERA / QR SCANNER ─────────────────────────────

/**
 * Check if camera is available via browser getUserMedia.
 */
export const isCameraAvailable = async (): Promise<boolean> => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(t => t.stop());
            return true;
        } catch {
            return false;
        }
    }
    return false;
};


// ─── BACKGROUND SOCKET RECONNECTION ─────────────────

/**
 * Register a handler that fires when the app/tab becomes visible again.
 * Uses visibilitychange API. Returns a cleanup function.
 */
export const registerBackgroundReconnect = (reconnectFn: () => void): (() => void) => {
    const handler = () => {
        if (document.visibilityState === 'visible') {
            console.log('[App] Tab visible — reconnecting socket');
            reconnectFn();
        }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
};
