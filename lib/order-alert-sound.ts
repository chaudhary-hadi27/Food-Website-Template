/**
 * Plays a loud "Naya order aa gaya hai, dashboard check karein!" alert.
 *
 * Two layers, in order:
 *  1. A pre-recorded human voice clip hosted on Cloudinary (set via Settings → Order Alerts
 *     → Alert Audio URL) — sounds natural, no synthesis needed.
 *  2. The browser's built-in Web Speech API (SpeechSynthesis) — works with zero setup and
 *     zero network calls, so it's the reliable fallback if no audio URL is configured or the
 *     audio fails to load (e.g. offline).
 *
 * This only works while at least one tab/PWA window of the admin panel is open (foreground
 * or background) — see public/sw.js for why a fully closed app can't be woken to play audio.
 */

const ALERT_TEXT_ROMAN_URDU = "Naya order aa gaya hai, dashboard check karein!";

function speakFallback() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    // Cancel anything mid-utterance so overlapping orders don't garble each other.
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ALERT_TEXT_ROMAN_URDU);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("[order-alert] Speech synthesis unavailable:", e);
  }
}

let cachedAudioUrl: string | null | undefined; // undefined = not fetched yet, null = confirmed none set

async function getConfiguredAudioUrl(): Promise<string | null> {
  if (cachedAudioUrl !== undefined) return cachedAudioUrl;
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    cachedAudioUrl = data?.settings?.new_order_alert_audio_url || null;
  } catch {
    cachedAudioUrl = null;
  }
  return cachedAudioUrl ?? null;
}

/** Call this the moment a new order is detected (via push message or polling). */
export async function playNewOrderAlert(): Promise<void> {
  const audioUrl = await getConfiguredAudioUrl();

  if (!audioUrl) {
    speakFallback();
    return;
  }

  try {
    const audio = new Audio(audioUrl);
    audio.volume = 1;
    await audio.play();
  } catch (e) {
    // Autoplay blocked, file failed to load, offline, etc. — fall back to speech so the
    // alert still happens one way or another.
    console.warn("[order-alert] Cloudinary audio failed, falling back to speech synthesis:", e);
    speakFallback();
  }
}
