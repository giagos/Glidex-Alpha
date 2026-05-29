import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { useProject, newId } from '../../state/project';
import type { Part, PartCategory } from '../../domain/types';

const categories: PartCategory[] = [
  'motor', 'esc', 'battery', 'receiver', 'servo', 'electronics', 'hardware', 'payload', 'other',
];

export function PartsView() {
  const parts = useProject((s) => s.project.parts);
  const addPart = useProject((s) => s.addPart);
  const updatePart = useProject((s) => s.updatePart);
  const removePart = useProject((s) => s.removePart);

  const onAdd = () => {
    const p: Part = { id: newId('part'), name: 'New part', category: 'other', mass_g: 10 };
    addPart(p);
  };

  return (
    <Window title="Parts library" toolbar={<Button size="sm" onClick={onAdd}>+ Add</Button>}>
      <div className="flex flex-col gap-2">
        {parts.length === 0 && (
          <Panel inset>
            <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              No parts yet. Add electronics (motor, ESC, battery, RX, servos, payload).
            </span>
          </Panel>
        )}
        {parts.map((p) => (
          <Panel key={p.id}>
            <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1.2fr 1fr auto' }}>
              <Field label="Name" value={p.name} onValueChange={(v) => updatePart(p.id, (pp) => ({ ...pp, name: v }))} />
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                  Category
                </span>
                <select
                  value={p.category}
                  onChange={(e) => updatePart(p.id, (pp) => ({ ...pp, category: e.target.value as PartCategory }))}
                  className="mono"
                  style={selectStyle}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <Field label="Mass" unit="g" value={p.mass_g}
                onValueChange={(v) => updatePart(p.id, (pp) => ({ ...pp, mass_g: parseFloat(v) || 0 }))} />
              <div className="flex items-end pb-1">
                <Button size="sm" onClick={() => removePart(p.id)}>Remove</Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </Window>
  );
}

const selectStyle: React.CSSProperties = {
  background: 'var(--cream-card)',
  boxShadow: 'var(--shadow-bevel-in)',
  borderRadius: 3,
  padding: '2px 6px',
  fontSize: 13,
  border: 'none',
};
