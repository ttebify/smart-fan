import { Button } from '@ui-sdk/react/button';
import { Meter, MeterIndicator, MeterLabel, MeterTrack } from '@ui-sdk/react/meter';
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { Slider, SliderControl, SliderIndicator, SliderThumb, SliderTrack } from '@ui-sdk/react/slider';
import { Switch, SwitchThumb } from '@ui-sdk/react/switch';
import { useStore, type TuneKey } from '../sim/store';
import { Radar } from './radar';

function Mode() {
  const smart = useStore(s => s.params.smart);
  const setParam = useStore(s => s.setParam);
  return (
    <SegmentedControl aria-label="Fan mode" value={smart ? 'smart' : 'dumb'} onValueChange={v => { if (v) setParam('smart', v === 'smart'); }}>
      <SegmentedControlIndicator />
      <SegmentedControlItem value="smart">Smart</SegmentedControlItem>
      <SegmentedControlItem value="dumb">Ordinary fan</SegmentedControlItem>
    </SegmentedControl>
  );
}

// Each of these subscribes to exactly the slice it shows, so the 5 Hz telemetry
// re-renders three small components and nothing else in the panel.
function Stats() {
  const sweep = useStore(s => s.telemetry.sweep);
  const people = useStore(s => s.telemetry.people);
  const state = useStore(s => s.telemetry.state);
  return (
    <div className="stats">
      <div><b>{sweep === null ? '–' : sweep + '°'}</b><small>sweep</small></div>
      <div><b>{people}</b><small>people tracked</small></div>
      <div><b>{state}</b><small>state</small></div>
    </div>
  );
}

function Score({ label, mode }: { label: string; mode: 'smart' | 'dumb' }) {
  const pct = useStore(s => s.telemetry[mode]);
  return (
    <Meter className="bar" value={pct ?? 0} getValueLabel={() => (pct === null ? 'not enough data yet' : pct + '%')}>
      <MeterLabel>{label}</MeterLabel>
      <MeterTrack>
        <MeterIndicator className={mode === 'dumb' ? 'dim' : undefined} />
      </MeterTrack>
      <b>{pct === null ? '–' : pct + '%'}</b>
    </Meter>
  );
}

function Tune({ label, k, min, max, step, fmt }: { label: string; k: TuneKey; min: number; max: number; step: number; fmt: (v: number) => string }) {
  const value = useStore(s => s.params[k]);
  const setParam = useStore(s => s.setParam);
  return (
    <div className="row">
      <span>{label}</span>
      <output>{fmt(value)}</output>
      <Slider value={value} min={min} max={max} step={step} onValueChange={v => setParam(k, v as number)}>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb aria-label={label} />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="check">
      <Switch checked={checked} onCheckedChange={onChange}>
        <SwitchThumb />
      </Switch>
      {label}
    </label>
  );
}

/** The panel's contents, shared by the desktop side panel and the phone drawer. */
export function Controls() {
  const gapSkip = useStore(s => s.params.gapSkip);
  const showAir = useStore(s => s.showAir);
  const setParam = useStore(s => s.setParam);
  const set = useStore(s => s.set);
  return (
    <>
      <Mode />
      <Radar />
      <Stats />

      <h3>Air landing on people</h3>
      <Score label="Smart" mode="smart" />
      <Score label="Ordinary" mode="dumb" />
      <p className="hint">Switch modes for a while to compare.</p>

      <h3>Tuning</h3>
      <Tune label="Confidence threshold" k="threshold" min={0.3} max={0.95} step={0.01} fmt={v => v.toFixed(2)} />
      <Tune label="Edge margin" k="margin" min={0} max={20} step={1} fmt={v => v + '°'} />
      <Tune label="Hold after losing someone" k="hold" min={0} max={8} step={0.5} fmt={v => v + ' s'} />
      <Tune label="Sensor noise" k="noise" min={0} max={3} step={0.1} fmt={v => v.toFixed(1) + '×'} />
      <Check label="Skip quickly across empty gaps" checked={gapSkip} onChange={on => setParam('gapSkip', on)} />
      <Check label="Show airflow" checked={showAir} onChange={on => set({ showAir: on })} />
    </>
  );
}

export function ControlPanel() {
  const set = useStore(s => s.set);
  return (
    <aside className="panel side">
      <div className="head">
        <h1>Smart Fan</h1>
        <Button className="icon" aria-label="Hide controls" onClick={() => set({ hideRight: true })}>×</Button>
      </div>
      <Controls />
    </aside>
  );
}
