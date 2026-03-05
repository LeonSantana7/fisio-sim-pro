import { useState } from 'react';

export function useDevice() {
    const [deviceKey] = useState<string>(() => {
        const key = localStorage.getItem('fisiosim_device_key');
        if (key) return key;
        const newKey = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('fisiosim_device_key', newKey);
        return newKey;
    });

    return { deviceKey };
}
