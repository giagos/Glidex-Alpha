import { useState } from 'react';
import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { Stat } from '../../components/Stat';
import { useProject, newId } from '../../state/project';
import { useDerived } from './useDerived';
import { proposeBallast, type BallastProposal } from '../../domain/ballast';

export function BallastView() {
  const project = useProject((s) => s.project);
  const updateComponent = useProject((s) => s.updateComponent);
  const addComponent = useProject((s) => s.addComponent);
  const setTarget = useProject((s) => s.setTarget);
  const d = useDerived(project);
  const [ballastX, setBallastX] = useState(20);
  const [proposal, setProposal] = useState<BallastProposal | null>(null);

  const target = project.target?.x_mm ?? d.cgTarget_mm;
  const range = project.target?.range_mm ?? d.cgRange_mm;

  const run = () => {
    const p = proposeBallast(
      project.components,
      project.materials,
      project.parts,
      target,
      range,
      { ballastX_mm: ballastX },
    );
    setProposal(p);
  };

  const apply = () => {
    if (!proposal) return;
    proposal.moves.forEach((mv) =>
      updateComponent(mv.id, (c) => ({ ...c, x_mm: mv.to_x_mm })),
    );
    if (proposal.ballast_g > 0) {
      addComponent({
        id: newId('ballast'),
        name: 'Computed ballast',
        kind: 'ballast',
        source: { kind: 'fixed', mass_g: proposal.ballast_g },
        x_mm: proposal.ballast_x_mm,
        y_mm: 0,
        z_mm: 0,
        visible: true,
      });
    }
    setProposal(null);
  };

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
      <Window title="CG target and solver">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Current CG" value={d.cg_x_mm.toFixed(1)} unit="mm" />
          <Stat label="Target CG" value={target.toFixed(1)} unit="mm" />
          <Stat
            label="Safe range fwd"
            value={range[0].toFixed(1)}
            unit="mm"
            emphasis={d.cg_x_mm < range[0] ? 'warn' : 'normal'}
          />
          <Stat
            label="Safe range aft"
            value={range[1].toFixed(1)}
            unit="mm"
            emphasis={d.cg_x_mm > range[1] ? 'warn' : 'normal'}
          />
        </div>
        <Panel inset style={{ marginTop: 10 }}>
          <div className="grid grid-cols-3 gap-2 items-end">
            <Field
              label="Override target"
              unit="mm"
              value={target}
              onValueChange={(v) =>
                setTarget({ x_mm: parseFloat(v) || 0, range_mm: range })
              }
            />
            <Field
              label="Range fwd"
              unit="mm"
              value={range[0]}
              onValueChange={(v) =>
                setTarget({ x_mm: target, range_mm: [parseFloat(v) || 0, range[1]] })
              }
            />
            <Field
              label="Range aft"
              unit="mm"
              value={range[1]}
              onValueChange={(v) =>
                setTarget({ x_mm: target, range_mm: [range[0], parseFloat(v) || 0] })
              }
            />
          </div>
        </Panel>
        <Panel inset style={{ marginTop: 10 }}>
          <div className="grid grid-cols-2 gap-2 items-end">
            <Field
              label="Ballast position"
              unit="mm from nose"
              value={ballastX}
              onValueChange={(v) => setBallastX(parseFloat(v) || 0)}
              hint="Where ballast will be placed (typically the nose, x ≈ 0)."
            />
            <Button onClick={run}>Compute ballast & moves</Button>
          </div>
        </Panel>
      </Window>

      <Window title="Proposal">
        {!proposal && (
          <Panel inset>
            <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              Click "Compute ballast &amp; moves" to see suggestions.
            </span>
          </Panel>
        )}
        {proposal && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Ballast needed"
                value={proposal.ballast_g.toFixed(1)}
                unit="g"
                emphasis={proposal.ballast_g > 0 ? 'warn' : 'good'}
              />
              <Stat
                label="Predicted CG"
                value={proposal.predictedCG_mm.toFixed(1)}
                unit="mm"
              />
            </div>
            {proposal.moves.length > 0 && (
              <Panel inset>
                <div
                  className="text-[11px] uppercase tracking-wider mb-1"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  Suggested moves
                </div>
                <table className="mono text-[12px] w-full">
                  <thead>
                    <tr style={{ color: 'var(--ink-muted)' }}>
                      <th className="text-left">Component</th>
                      <th className="text-right">from</th>
                      <th className="text-right">to</th>
                      <th className="text-right">mass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.moves.map((m) => (
                      <tr key={m.id}>
                        <td>{project.components.find((c) => c.id === m.id)?.name}</td>
                        <td className="text-right">{m.from_x_mm.toFixed(1)}</td>
                        <td className="text-right">{m.to_x_mm.toFixed(1)}</td>
                        <td className="text-right">{m.mass_g.toFixed(1)} g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )}
            <Panel inset>
              <div className="text-[12px]">{proposal.explanation}</div>
            </Panel>
            <Button variant="primary" onClick={apply}>
              Apply this proposal
            </Button>
          </div>
        )}
      </Window>

      <div style={{ gridColumn: '1 / -1' }}>
        <Window title="Top mass contributors">
          <table className="mono text-[12px] w-full">
            <thead>
              <tr style={{ color: 'var(--ink-muted)' }}>
                <th className="text-left">Component</th>
                <th className="text-left">Kind</th>
                <th className="text-right">x [mm]</th>
                <th className="text-right">mass [g]</th>
                <th className="text-right">moment [g·mm]</th>
                <th className="text-right">% of |moment|</th>
              </tr>
            </thead>
            <tbody>
              {[...d.contributions]
                .sort((a, b) => Math.abs(b.moment_g_mm) - Math.abs(a.moment_g_mm))
                .map((c) => {
                  const totalAbs = d.contributions.reduce(
                    (acc, x) => acc + Math.abs(x.moment_g_mm),
                    0,
                  ) || 1;
                  return (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.kind}</td>
                      <td className="text-right">{c.x_mm.toFixed(1)}</td>
                      <td className="text-right">{c.mass_g.toFixed(1)}</td>
                      <td className="text-right">{c.moment_g_mm.toFixed(0)}</td>
                      <td className="text-right">
                        {((Math.abs(c.moment_g_mm) / totalAbs) * 100).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Window>
      </div>
    </div>
  );
}
