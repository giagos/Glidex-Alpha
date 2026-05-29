import { useProject } from '../../state/project';
import { useDerived } from './useDerived';
import { Window } from '../../components/Window';
import { Stat } from '../../components/Stat';
import { Panel } from '../../components/Panel';
import { SideView } from '../../drawing/SideView';
import { TopView } from '../../drawing/TopView';

export function WorkbenchView() {
  const project = useProject((s) => s.project);
  const selectedId = useProject((s) => s.selectedComponentId);
  const selectComponent = useProject((s) => s.selectComponent);
  const d = useDerived(project);

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 320px' }}>
      <div className="flex flex-col gap-3">
        <Window title="Side view">
          <SideView
            aircraft={project.aircraft}
            components={project.components}
            materials={project.materials}
            parts={project.parts}
            cg_x_mm={d.cg_x_mm}
            cgRange_mm={d.cgRange_mm}
            selectedId={selectedId}
            onSelect={selectComponent}
          />
        </Window>
        <Window title="Top view">
          <TopView
            aircraft={project.aircraft}
            cg_x_mm={d.cg_x_mm}
            cgRange_mm={d.cgRange_mm}
          />
        </Window>
      </div>
      <div className="flex flex-col gap-3">
        <Window title="Key numbers">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Total mass" value={d.totalMass_g.toFixed(1)} unit="g" />
            <Stat
              label="CG (from nose)"
              value={d.cg_x_mm.toFixed(1)}
              unit="mm"
              emphasis={
                d.cg_x_mm < d.cgRange_mm[0] || d.cg_x_mm > d.cgRange_mm[1]
                  ? 'warn'
                  : 'good'
              }
            />
            <Stat label="Wing area" value={d.wingArea_dm2.toFixed(2)} unit="dm²" />
            <Stat label="Aspect ratio" value={d.aspectRatio.toFixed(2)} />
            <Stat label="MAC" value={d.mac_mm.toFixed(1)} unit="mm" />
            <Stat
              label="Wing loading"
              value={d.wingLoading_g_dm2.toFixed(1)}
              unit="g/dm²"
              emphasis={d.wingLoading_g_dm2 > 120 ? 'warn' : 'normal'}
            />
            <Stat label="Cubic WL" value={d.cubicWingLoading.toFixed(2)} />
            <Stat label="V-stall" value={d.stallSpeed_m_s.toFixed(1)} unit="m/s" />
            <Stat label="Tail volume" value={d.tailVolume.toFixed(2)} />
            <Stat label="Re @ cruise" value={Math.round(d.reynoldsAtCruise).toLocaleString()} />
          </div>
        </Window>
        <Window title="Warnings">
          {d.warnings.length === 0 ? (
            <Panel inset>
              <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                No issues detected.
              </span>
            </Panel>
          ) : (
            <div className="flex flex-col gap-2">
              {d.warnings.map((w, i) => (
                <Panel inset key={i}>
                  <div className="flex items-start gap-2">
                    <span
                      className="mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          w.level === 'danger'
                            ? 'var(--danger)'
                            : w.level === 'warn'
                              ? 'var(--warn)'
                              : 'var(--ink-muted)',
                        color: 'var(--cream-card)',
                      }}
                    >
                      {w.level.toUpperCase()}
                    </span>
                    <span className="text-[12px]">{w.message}</span>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </Window>
      </div>
    </div>
  );
}
