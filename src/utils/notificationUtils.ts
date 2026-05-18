import { translations } from './translations';
import { Language } from '../App';
import { NotificationItem } from '../hooks/useNotifications';

/**
 * Localizes a notification message based on its type and data.
 * Falls back to the original message if no translation template is found.
 */
export function getLocalizedNotificationMessage(notification: NotificationItem, language: Language): string {
  let type = notification.type;
  let data = notification.data;

  // Heuristic: If type is missing, try to infer it from common English message patterns (for legacy notifications)
  if (!type && notification.message) {
    if (notification.message.includes('anchorage request') && notification.message.includes('approved')) {
      type = 'wharf_assigned';
      const vesselMatch = notification.message.match(/vessel (.*?) has/);
      const wharfMatch = notification.message.match(/Wharf (.*?) has/);
      data = { 
        vessel: vesselMatch ? vesselMatch[1] : 'Unknown', 
        wharf: wharfMatch ? wharfMatch[1] : 'Unknown' 
      };
    } else if (notification.message.includes('discharged successfully')) {
      type = 'discharge_approved';
      const vesselMatch = notification.message.match(/from (.*?) have/);
      data = { vessel: vesselMatch ? vesselMatch[1] : 'Unknown' };
    } else if (notification.message.includes('declined') && notification.message.includes('Discharge')) {
      type = 'discharge_declined';
      const vesselMatch = notification.message.match(/for (.*?) has/);
      const reasonMatch = notification.message.match(/Reason: (.*)/);
      data = { 
        vessel: vesselMatch ? vesselMatch[1] : 'Unknown',
        reason: reasonMatch ? reasonMatch[1] : 'Unknown'
      };
    } else if (notification.message.includes('awaiting arrival approval')) {
      type = 'vessel_awaiting_approval';
      const vesselMatch = notification.message.match(/Vessel (.*?) is/);
      data = { name: vesselMatch ? vesselMatch[1] : 'Unknown' };
    }
  }

  if (!type) {
    return notification.message;
  }

  const langTranslations = (translations as any)[language]?.notifications || (translations as any).en.notifications;
  const template = langTranslations[type];

  if (!template) {
    return notification.message;
  }

  // Handle data injection (placeholders like {vessel})
  let localized = template;
  const contextData = typeof data === 'object' && data !== null ? data : {};
  
  Object.entries(contextData).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    localized = localized.replace(new RegExp(placeholder, 'g'), String(value));
  });

  // Handle operationId as a generic {id} fallback if data.id is missing
  if (notification.operationId && localized.includes('{id}') && !contextData.id) {
    localized = localized.replace(/{id}/g, String(notification.operationId));
  }

  return localized;
}
