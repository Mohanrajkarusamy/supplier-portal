import emailjs from '@emailjs/browser';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export const getEmailConfig = (): EmailConfig | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('emailjs_config');
  return stored ? JSON.parse(stored) : null;
};

export const saveEmailConfig = (config: EmailConfig) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('emailjs_config', JSON.stringify(config));
};

export const sendEmail = async (
  to_name: string,
  to_email: string,
  message: string,
  subject: string,
  additionalParams: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> => {
  const config = getEmailConfig();

  if (!config || !config.serviceId || !config.templateId || !config.publicKey) {
    console.warn("EmailJS not configured. Running in SIMULATION MODE.");
    console.log(`[SIMULATION] Sending Email to ${to_email}:`, { subject, message });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return { success: true }; // Treat as success for demo purposes
  }

  try {
    // Get configured Admin Email if available
    const adminEmail = typeof window !== 'undefined' ? localStorage.getItem('admin_email') : "admin@company.com";

    const templateParams = {
      to_name,
      to_email,
      message,
      subject,
      // Common variations to handle different user template setups
      email: to_email,
      recipient: to_email,
      to: to_email,
      reply_to: adminEmail || "admin@company.com", 
      from_name: "Supplier Portal System",
      ...additionalParams
    };
    
    console.log("EmailJS Sending with params:", templateParams);

    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );

    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `EmailJS Error: ${response.text}` };
    }
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.text || error.message || "Unknown error occurred" };
  }
};
