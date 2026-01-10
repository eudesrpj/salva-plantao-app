import { apiRequest } from "./queryClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function isPushEnabled(): Promise<boolean> {
  if (!await isPushSupported()) return false;
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return Notification.permission;
}

export async function subscribeToPush(): Promise<{ success: boolean; message: string }> {
  try {
    if (!await isPushSupported()) {
      return { success: false, message: "Push notifications not supported on this browser" };
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: "Permission denied" };
    }
    
    const vapidKeyResponse = await fetch('/api/push/vapid-key');
    if (!vapidKeyResponse.ok) {
      return { success: false, message: "Failed to get server configuration" };
    }
    const { publicKey } = await vapidKeyResponse.json();
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    const subscriptionJson = subscription.toJSON();
    
    await apiRequest('POST', '/api/push/subscribe', {
      endpoint: subscriptionJson.endpoint,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth
      },
      userAgent: navigator.userAgent
    });
    
    return { success: true, message: "Notifications enabled!" };
  } catch (error: any) {
    console.error('Push subscription error:', error);
    return { success: false, message: error.message || "Failed to enable notifications" };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean; message: string }> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return { success: true, message: "Already unsubscribed" };
    }
    
    await apiRequest('POST', '/api/push/unsubscribe', { endpoint: subscription.endpoint });
    
    await subscription.unsubscribe();
    
    return { success: true, message: "Notifications disabled" };
  } catch (error: any) {
    console.error('Push unsubscription error:', error);
    return { success: false, message: error.message || "Failed to disable notifications" };
  }
}
