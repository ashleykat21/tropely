const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? "";

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!TOKEN) return;
  try {
    const data = btoa(JSON.stringify({
      event: name,
      properties: { token: TOKEN, time: Date.now(), ...props },
    }));
    fetch(`https://api.mixpanel.com/track?data=${data}`).catch(() => {});
  } catch {}
}

export function identifyUser(userId: string, props?: Record<string, unknown>) {
  if (!TOKEN) return;
  try {
    const data = btoa(JSON.stringify({
      $token: TOKEN,
      $distinct_id: userId,
      $set: props ?? {},
    }));
    fetch(`https://api.mixpanel.com/engage?data=${data}`).catch(() => {});
  } catch {}
}
