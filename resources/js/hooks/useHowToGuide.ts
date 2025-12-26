import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ej_hasSeenHowToGuide';

export default function useHowToGuide(): {
    open: boolean;
    openGuide: () => void;
    closeGuide: () => void;
} {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const seen = window.localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            setOpen(true);
        }
    }, []);

    const openGuide = useCallback(() => {
        setOpen(true);
    }, []);

    const closeGuide = useCallback(() => {
        setOpen(false);
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    return { open, openGuide, closeGuide };
}
