export interface SMSResult {
  success: boolean;
  error?: string;
  isSimulation?: boolean;
}

export async function sendServerSMS(to: string, message: string): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio credentials not fully configured in environment variables. Running in SMS SIMULATION MODE.");
    console.log(`\n================== SMS SIMULATION ==================`);
    console.log(`To:      ${to}`);
    console.log(`From:    ${fromNumber || 'SIMULATOR'}`);
    console.log(`Message: ${message}`);
    console.log(`====================================================\n`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, isSimulation: true };
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authStr = `${accountSid}:${authToken}`;
    const auth = Buffer.from(authStr).toString('base64');
    
    console.log(`Sending real SMS via Twilio to: ${to}...`);
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Twilio SMS sent successfully. Message SID: ${data.sid}`);
      return { success: true, isSimulation: false };
    } else {
      const errData = await response.json();
      console.error(`Twilio SMS API rejected request:`, errData);
      return { 
        success: false, 
        error: errData.message || `Twilio HTTP error ${response.status}: ${response.statusText}` 
      };
    }
  } catch (error: any) {
    console.error("Twilio SMS sending failed with exception:", error);
    return { success: false, error: error.message || "Unknown Twilio SMS error occurred" };
  }
}
