import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Panel } from '../../components/Panel';
import { Stat } from '../../components/Stat';
import { useProject } from '../../state/project';
import { useDerived } from './useDerived';

export function AeroView() {
  const project = useProject((s) => s.project);
  const updateAero = useProject((s) => s.updateAero);
  const d = useDerived(project);

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
      <Window title="Air & flight parameters">
        <div className="grid grid-cols-1 gap-2">
          <Field
            label="CLmax (clean stall)"
            value={project.aero.cl_max}
            onValueChange={(v) => updateAero((a) => ({ ...a, cl_max: parseFloat(v) || 0 }))}
            hint="Typical flat-bottom airfoil ≈ 1.1–1.4. Foam wings often 1.0–1.2."
          />
          <Field
            label="Air density"
            unit="kg/m³"
            value={project.aero.air_density_kg_m3}
            onValueChange={(v) => updateAero((a) => ({ ...a, air_density_kg_m3: parseFloat(v) || 0 }))}
            hint="Sea level standard = 1.225 kg/m³."
          />
          <Field
            label="Cruise speed"
            unit="m/s"
            value={project.aero.cruise_speed_m_s}
            onValueChange={(v) => updateAero((a) => ({ ...a, cruise_speed_m_s: parseFloat(v) || 0 }))}
            hint="Used for Reynolds and required-CL estimates."
          />
        </div>
      </Window>

      <Window title="Computed aerodynamic numbers">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Wing area" value={d.wingArea_dm2.toFixed(2)} unit="dm²" />
          <Stat label="Aspect ratio" value={d.aspectRatio.toFixed(2)} />
          <Stat label="MAC" value={d.mac_mm.toFixed(1)} unit="mm" />
          <Stat
            label="Wing loading"
            value={d.wingLoading_g_dm2.toFixed(1)}
            unit="g/dm²"
            emphasis={d.wingLoading_g_dm2 > 120 ? 'warn' : 'normal'}
          />
          <Stat label="Cubic wing loading" value={d.cubicWingLoading.toFixed(2)} />
          <Stat
            label="Stall speed"
            value={d.stallSpeed_m_s.toFixed(1)}
            unit="m/s"
            emphasis={d.stallSpeed_m_s > 12 ? 'warn' : 'normal'}
          />
          <Stat label="Re @ cruise" value={Math.round(d.reynoldsAtCruise).toLocaleString()} />
          <Stat label="Required CL @ cruise" value={d.requiredCL.toFixed(2)} />
          <Stat label="Tail volume Vh" value={d.tailVolume.toFixed(2)} />
        </div>
        <Panel inset style={{ marginTop: 10 }}>
          <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            All values are approximate estimates intended for design guidance, not certified analysis.
            Stall speed uses V = √(2·W / (ρ·S·CLmax)). Re uses ν = 1.46×10⁻⁵ m²/s.
          </div>
        </Panel>
      </Window>
    </div>
  );
}
