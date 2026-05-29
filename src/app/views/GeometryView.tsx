import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Panel } from '../../components/Panel';
import { useProject } from '../../state/project';
import { useDerived } from './useDerived';

function num(v: string): number {
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}

export function GeometryView() {
  const project = useProject((s) => s.project);
  const updateAircraft = useProject((s) => s.updateAircraft);
  const d = useDerived(project);
  const w = project.aircraft.wing;
  const ht = project.aircraft.htail;
  const vt = project.aircraft.vtail;
  const fus = project.aircraft.fuselage;
  const bay = project.aircraft.batteryBay;

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <Window title="Wing">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Span" unit="mm" value={w.span_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, span_mm: num(v) } }))} />
          <Field label="Root chord" unit="mm" value={w.root_chord_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, root_chord_mm: num(v) } }))} />
          <Field label="Tip chord" unit="mm" value={w.tip_chord_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, tip_chord_mm: num(v) } }))} />
          <Field label="Sweep" unit="°" value={w.sweep_deg}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, sweep_deg: num(v) } }))} />
          <Field label="Dihedral" unit="°" value={w.dihedral_deg}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, dihedral_deg: num(v) } }))} />
          <Field label="Incidence" unit="°" value={w.incidence_deg}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, incidence_deg: num(v) } }))} />
          <Field label="Root LE x" unit="mm" value={w.root_le_x_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, wing: { ...a.wing, root_le_x_mm: num(v) } }))} />
        </div>
      </Window>

      <Window title="Horizontal tail">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Span" unit="mm" value={ht.span_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, htail: { ...a.htail, span_mm: num(v) } }))} />
          <Field label="Root chord" unit="mm" value={ht.root_chord_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, htail: { ...a.htail, root_chord_mm: num(v) } }))} />
          <Field label="Tip chord" unit="mm" value={ht.tip_chord_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, htail: { ...a.htail, tip_chord_mm: num(v) } }))} />
          <Field label="Root LE x" unit="mm" value={ht.root_le_x_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, htail: { ...a.htail, root_le_x_mm: num(v) } }))} />
        </div>
      </Window>

      <Window title="Vertical tail">
        {vt ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Height" unit="mm" value={vt.height_mm}
              onValueChange={(v) => updateAircraft((a) => ({ ...a, vtail: { ...a.vtail!, height_mm: num(v) } }))} />
            <Field label="Root chord" unit="mm" value={vt.root_chord_mm}
              onValueChange={(v) => updateAircraft((a) => ({ ...a, vtail: { ...a.vtail!, root_chord_mm: num(v) } }))} />
            <Field label="Tip chord" unit="mm" value={vt.tip_chord_mm}
              onValueChange={(v) => updateAircraft((a) => ({ ...a, vtail: { ...a.vtail!, tip_chord_mm: num(v) } }))} />
            <Field label="Root LE x" unit="mm" value={vt.root_le_x_mm}
              onValueChange={(v) => updateAircraft((a) => ({ ...a, vtail: { ...a.vtail!, root_le_x_mm: num(v) } }))} />
          </div>
        ) : (
          <Panel inset>No vertical tail defined.</Panel>
        )}
      </Window>

      <Window title="Fuselage & battery bay">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Length" unit="mm" value={fus.length_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, fuselage: { ...a.fuselage, length_mm: num(v) } }))} />
          <Field label="Max width" unit="mm" value={fus.max_width_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, fuselage: { ...a.fuselage, max_width_mm: num(v) } }))} />
          <Field label="Max height" unit="mm" value={fus.max_height_mm}
            onValueChange={(v) => updateAircraft((a) => ({ ...a, fuselage: { ...a.fuselage, max_height_mm: num(v) } }))} />
          {bay && (
            <>
              <Field label="Bay x-min" unit="mm" value={bay.x_min_mm}
                onValueChange={(v) => updateAircraft((a) => ({ ...a, batteryBay: { ...a.batteryBay!, x_min_mm: num(v) } }))} />
              <Field label="Bay x-max" unit="mm" value={bay.x_max_mm}
                onValueChange={(v) => updateAircraft((a) => ({ ...a, batteryBay: { ...a.batteryBay!, x_max_mm: num(v) } }))} />
            </>
          )}
        </div>
      </Window>

      <div style={{ gridColumn: '1 / -1' }}>
        <Window title="Derived geometry">
          <div className="grid grid-cols-4 gap-2">
            <Cell label="Wing area" value={`${d.wingArea_dm2.toFixed(2)} dm²`} />
            <Cell label="Aspect ratio" value={d.aspectRatio.toFixed(2)} />
            <Cell label="MAC" value={`${d.mac_mm.toFixed(1)} mm`} />
            <Cell label="Tail volume Vh" value={d.tailVolume.toFixed(2)} />
            <Cell label="Default CG target" value={`${d.cgTarget_mm.toFixed(1)} mm`} />
            <Cell
              label="Safe CG range"
              value={`${d.cgRange_mm[0].toFixed(1)} – ${d.cgRange_mm[1].toFixed(1)} mm`}
            />
          </div>
        </Window>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <Panel inset>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </div>
      <div className="mono text-[14px]">{value}</div>
    </Panel>
  );
}
