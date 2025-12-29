export interface SystemSettings {
    ppmTargets: {
        preMachining: number // e.g. 2000
        childPart: number    // e.g. 0
    }
}

// Initial default settings
export let SYSTEM_SETTINGS: SystemSettings = {
    ppmTargets: {
        preMachining: 2000,
        childPart: 0
    }
}

// Helper to update settings (simulates API)
export function updateSettings(newSettings: Partial<SystemSettings>) {
    SYSTEM_SETTINGS = { ...SYSTEM_SETTINGS, ...newSettings }
}
