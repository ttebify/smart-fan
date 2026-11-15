import { useEffect, useSyncExternalStore } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CalloutLayer } from '@/scene/callouts';
import { TagLayer } from '@/scene/entities';
import { Scene } from '@/scene/scene';
import { useDrag } from '@/scene/use-drag';
import { useStore } from '@/sim/store';
import { ControlPanel } from '@/ui/control-panel';
import { Credit } from '@/ui/credit';
import { GLFallback } from '@/ui/gl-fallback';
import { MechPanel } from '@/ui/mech-panel';
import { Palette } from '@/ui/palette';
import { PhoneSheet } from '@/ui/phone-sheet';

const PHONE = '(max-width: 720px)';
function useIsPhone() {
  return useSyncExternalStore(
    notify => {
      const mq = matchMedia(PHONE);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => matchMedia(PHONE).matches,
  );
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.metaKey || ev.ctrlKey) return;
      const { clean, showLabels, set } = useStore.getState();
      const key = ev.key.toLowerCase();
      if (key === 'h') set({ clean: !clean });
      if (key === 'l') set({ showLabels: !showLabels });
      if (key === 'escape') set({ inspect: false });
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
}

export function App() {
  const phone = useIsPhone();
  const inspect = useStore(s => s.inspect);
  const hideLeft = useStore(s => s.hideLeft);
  const hideRight = useStore(s => s.hideRight);
  const clean = useStore(s => s.clean);
  const showLabels = useStore(s => s.showLabels);
  const set = useStore(s => s.set);
  useShortcuts();
  useDrag();

  const flags = [inspect && 'inspect', hideLeft && 'no-left', hideRight && 'no-right', clean && 'clean', !showLabels && 'no-labels'];
  return (
    <div className={['app', ...flags].filter(Boolean).join(' ')}>
      <GLFallback>
        <Scene />
      </GLFallback>
      <TagLayer />
      <CalloutLayer />
      <Palette />
      {phone ? <PhoneSheet /> : (
        <>
          <MechPanel />
          <ControlPanel />
          <button type="button" className="restore show-right" onClick={() => set({ hideRight: false })}>+ Controls</button>
        </>
      )}
      <button type="button" className="restore show-left" onClick={() => set({ hideLeft: false })}>+ Objects</button>
      <div className="keys"><kbd>H</kbd>show / hide panels &nbsp; <kbd>L</kbd>show / hide labels</div>
      <Credit />
      <Analytics />
    </div>
  );
}
