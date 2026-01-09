
export interface SMSResult {
    success: boolean;
    message?: string;
}

export const sendSMS = async (to: string, message: string): Promise<SMSResult> => {
    // Determine if we are in simulation mode (no real SMS gateway configured)
    const isSimulation = true; // Hardcoded for now as we don't have Twilio/etc keys

    console.log(`[SMS SIMULATION] Sending to ${to}: ${message}`);

    // Log to localStorage for debug visibility (reusing email log concept or new one)
    if (typeof window !== 'undefined') {
        try {
            const logs = JSON.parse(localStorage.getItem('sms_logs') || '[]');
            const newLog = {
                time: new Date().toLocaleString(),
                to,
                message,
                status: "SENT (SIMULATION)"
            };
            const updatedLogs = [newLog, ...logs].slice(0, 10);
            localStorage.setItem('sms_logs', JSON.stringify(updatedLogs));
        } catch (e) {
            console.error("Failed to save SMS log", e);
        }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return { 
        success: true, 
        message: "SMS sent successfully (Simulated)" 
    };
}
