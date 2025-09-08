// Communication services for SMS and voice calls
interface CommunicationResult {
  success: boolean;
  message: string;
  messageId?: string;
}

// SMS notification service
export async function sendSMSNotification(
  phoneNumber: string, 
  message: string, 
  isEmergency: boolean = false
): Promise<CommunicationResult> {
  try {
    // Check if Twilio credentials are available
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      // Mock success for demo/free tier
      console.log(`SMS Mock: Sending to ${phoneNumber}: ${message}`);
      return {
        success: true,
        message: "SMS sent successfully (demo mode)",
        messageId: `mock-${Date.now()}`
      };
    }

    // Real Twilio integration (when credentials provided)
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
      ...(isEmergency && { priority: 'high' })
    });

    return {
      success: true,
      message: "SMS sent successfully",
      messageId: result.sid
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      message: `Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Voice call service for emergency plant warnings
export async function makeEmergencyCall(
  phoneNumber: string, 
  plantName: string, 
  dangerLevel: 'warning' | 'danger' | 'emergency'
): Promise<CommunicationResult> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      // Mock success for demo
      console.log(`Voice Call Mock: Emergency call to ${phoneNumber} about ${plantName}`);
      return {
        success: true,
        message: "Emergency call initiated (demo mode)",
        messageId: `call-mock-${Date.now()}`
      };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const warningMessages = {
      warning: `Warning: The plant ${plantName} you identified may have safety concerns. Please exercise caution and consult medical professionals.`,
      danger: `Important safety alert: ${plantName} can be dangerous if consumed. Please avoid contact and seek medical advice if exposure occurred.`,
      emergency: `Emergency alert: ${plantName} is highly toxic. If consumed or significant contact occurred, seek immediate medical attention.`
    };

    const call = await client.calls.create({
      twiml: `<Response><Say voice="alice">${warningMessages[dangerLevel]}</Say></Response>`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return {
      success: true,
      message: "Emergency call initiated",
      messageId: call.sid
    };
  } catch (error) {
    console.error('Voice call error:', error);
    return {
      success: false,
      message: `Failed to make call: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Plant care reminder system
export async function sendPlantCareReminder(
  phoneNumber: string,
  plantName: string,
  careType: 'watering' | 'fertilizing' | 'harvesting' | 'general'
): Promise<CommunicationResult> {
  const careMessages = {
    watering: `Reminder: Time to water your ${plantName}. Check soil moisture and water if dry.`,
    fertilizing: `Reminder: Consider fertilizing your ${plantName} for optimal growth.`,
    harvesting: `Reminder: Your ${plantName} may be ready for harvesting. Check for maturity signs.`,
    general: `Care reminder for your ${plantName}. Monitor plant health and growth conditions.`
  };

  return await sendSMSNotification(phoneNumber, careMessages[careType]);
}

// Community alert system
export async function sendCommunityAlert(
  recipients: string[],
  alertType: 'new_plant' | 'safety_warning' | 'knowledge_update',
  content: string
): Promise<CommunicationResult[]> {
  const results: CommunicationResult[] = [];
  
  for (const phoneNumber of recipients) {
    const result = await sendSMSNotification(phoneNumber, content);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// WhatsApp integration (free tier friendly)
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<CommunicationResult> {
  try {
    // For WhatsApp, we can use Twilio's WhatsApp sandbox (free tier)
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log(`WhatsApp Mock: Sending to ${phoneNumber}: ${message}`);
      return {
        success: true,
        message: "WhatsApp message sent (demo mode)",
        messageId: `whatsapp-mock-${Date.now()}`
      };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const result = await client.messages.create({
      body: message,
      from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
      to: 'whatsapp:' + phoneNumber
    });

    return {
      success: true,
      message: "WhatsApp message sent successfully",
      messageId: result.sid
    };
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return {
      success: false,
      message: `Failed to send WhatsApp message: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}