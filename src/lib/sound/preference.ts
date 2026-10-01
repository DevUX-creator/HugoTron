const SOUND_PREFERENCE_KEY = "hugo-sound-enabled";

let preference: boolean | undefined;
const listeners = new Set<() => void>();

function storedPreference() {
  try {
    return localStorage.getItem(SOUND_PREFERENCE_KEY) !== "false";
  } catch {
    return preference ?? true;
  }
}

/** Default on; explicit mute survives reloads. Storage failure still preserves this session. */
export function readSoundPreference() {
  if (typeof window === "undefined") return true;
  preference ??= storedPreference();
  return preference;
}

export function writeSoundPreference(enabled: boolean) {
  preference = enabled;
  try {
    localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
  } catch {
    // In-memory choice still works in private/restricted storage contexts.
  }
  listeners.forEach((notify) => notify());
}

export function subscribeSoundPreference(notify: () => void) {
  listeners.add(notify);
  const changed = (event: StorageEvent) => {
    if (event.key !== SOUND_PREFERENCE_KEY && event.key !== null) return;
    preference = storedPreference();
    notify();
  };
  window.addEventListener("storage", changed);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", changed);
  };
}
