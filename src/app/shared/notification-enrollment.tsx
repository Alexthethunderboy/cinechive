'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Bell, BellOff, BellRing, LoaderCircle, Smartphone } from 'lucide-react';

type EnrollmentState = 'checking' | 'unsupported' | 'install' | 'ready' | 'subscribed' | 'denied' | 'working';

function applicationServerKey(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

async function serviceWorkerRegistration() {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export default function NotificationEnrollment({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<EnrollmentState>('checking');
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function inspect() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState('unsupported');
        return;
      }

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (isIos && !isStandalone) {
        setState('install');
        return;
      }

      if (Notification.permission === 'denied') {
        setState('denied');
        return;
      }

      try {
        const registration = await serviceWorkerRegistration();
        const subscription = await registration.pushManager.getSubscription();
        setState(subscription ? 'subscribed' : 'ready');
      } catch {
        setState('unsupported');
      }
    }

    void inspect();
  }, []);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) {
      setMessage('Enter the family notification code.');
      return;
    }

    setState('working');
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'ready');
        setMessage('Notification permission was not granted.');
        return;
      }

      const registration = await serviceWorkerRegistration();
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(publicKey),
      });
      const response = await fetch('/api/notifications/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setup_code: code.trim(), subscription: subscription.toJSON() }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not enable notifications');

      setCode('');
      setShowCode(false);
      setState('subscribed');
      setMessage('Notifications are on for this device.');
    } catch (error) {
      setState('ready');
      setMessage(error instanceof Error ? error.message : 'Could not enable notifications');
    }
  }

  async function unsubscribe() {
    setState('working');
    setMessage('');
    try {
      const registration = await serviceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch('/api/notifications/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error('Could not disable notifications');
        await subscription.unsubscribe();
      }
      setState('ready');
      setMessage('Notifications are off for this device.');
    } catch (error) {
      setState('subscribed');
      setMessage(error instanceof Error ? error.message : 'Could not disable notifications');
    }
  }

  if (state === 'checking') {
    return <div className="mt-5 h-11 w-52 animate-pulse rounded-xl bg-white/5" aria-label="Checking notification support" />;
  }
  if (state === 'unsupported') return null;

  if (state === 'install') {
    return (
      <div className="mt-5 flex max-w-xl items-start gap-3 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] px-4 py-3 text-sm text-violet-50">
        <Smartphone aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-violet-300" />
        <p><strong className="font-bold">Get new-title alerts:</strong> tap Share, choose Add to Home Screen, then open CineChive from its new icon.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 max-w-xl" aria-live="polite">
      {state === 'subscribed' ? (
        <button
          type="button"
          onClick={() => void unsubscribe()}
          className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <BellRing aria-hidden="true" className="size-4" /> Notifications on
        </button>
      ) : state === 'denied' ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-50">
          <BellOff aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
          <p>Notifications are blocked in this device’s settings.</p>
        </div>
      ) : showCode ? (
        <form onSubmit={subscribe} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:flex-row">
          <label className="sr-only" htmlFor="notification-code">Family notification code</label>
          <input
            id="notification-code"
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            placeholder="Family notification code"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-300"
          />
          <button
            type="submit"
            disabled={state === 'working'}
            className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-black transition hover:bg-zinc-200 disabled:opacity-60"
          >
            {state === 'working' ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Bell aria-hidden="true" className="size-4" />}
            Enable alerts
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowCode(true)}
          disabled={state === 'working'}
          className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Bell aria-hidden="true" className="size-4" /> Get new-title alerts
        </button>
      )}
      {message && <p className="mt-2 text-xs text-zinc-400">{message}</p>}
    </div>
  );
}
