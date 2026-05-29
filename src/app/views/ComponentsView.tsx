import { useState } from 'react';
import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { useProject, newId } from '../../state/project';
import { resolveAll } from '../../domain/mass';
import type { Component, ComponentKind, MassSource } from '../../domain/types';

const kinds: ComponentKind[] = [
  'structure', 'spar', 'glue', 'electronics', 'motor', 'esc',
  'battery', 'receiver', 'servo', 'payload', 'ballast', 'other',
];

export function ComponentsView() {
  const project = useProject((s) => s.project);
  const addComponent = useProject((s) => s.addComponent);
  const updateComponent = useProject((s) => s.updateComponent);
  const removeComponent = useProject((s) => s.removeComponent);
  const selectedId = useProject((s) => s.selectedComponentId);
  const select = useProject((s) => s.selectComponent);
  const [filter, setFilter] = useState('');

  const resolved = resolveAll(project.components, project.materials, project.parts);
  const massById = new Map(resolved.map((r) => [r.component.id, r.mass_g] as const));
  const derivById = new Map(resolved.map((r) => [r.component.id, r.derivation] as const));

  const onAdd = () => {
    const c: Component = {
      id: newId('c'),
      name: 'New component',
      kind: 'other',
      source: { kind: 'fixed', mass_g: 10 },
      x_mm: 200,
      y_mm: 0,
      z_mm: 0,
      visible: true,
    };
    addComponent(c);
  };

  const filtered = project.components.filter((c) =>
    filter ? c.name.toLowerCase().includes(filter.toLowerCase()) : true,
  );

  return (
    <Window
      title="Components placed on aircraft"
      toolbar={
        <div className="flex items-center gap-2">
          <input
            placeholder="filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mono"
            style={{ ...inputStyle, width: 130, fontSize: 12 }}
          />
          <Button size="sm" onClick={onAdd}>+ Add</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {filtered.map((c) => {
          const mass = massById.get(c.id) ?? 0;
          const derivation = derivById.get(c.id) ?? '';
          const selected = c.id === selectedId;
          return (
            <Panel
              key={c.id}
              style={{
                outline: selected ? '2px solid var(--accent-warm)' : undefined,
                outlineOffset: -2,
              }}
            >
              <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1.2fr 1.6fr 0.7fr 0.7fr auto' }}>
                <Field
                  label="Name"
                  value={c.name}
                  onValueChange={(v) => updateComponent(c.id, (cc) => ({ ...cc, name: v }))}
                />
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                    Kind
                  </span>
                  <select
                    value={c.kind}
                    onChange={(e) =>
                      updateComponent(c.id, (cc) => ({ ...cc, kind: e.target.value as ComponentKind }))
                    }
                    className="mono"
                    style={inputStyle}
                  >
                    {kinds.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <SourceEditor
                  source={c.source}
                  onChange={(src) => updateComponent(c.id, (cc) => ({ ...cc, source: src }))}
                />
                <Field
                  label="x"
                  unit="mm"
                  value={c.x_mm}
                  onValueChange={(v) => updateComponent(c.id, (cc) => ({ ...cc, x_mm: parseFloat(v) || 0 }))}
                />
                <div className="flex flex-col" style={{ paddingTop: 18 }} title={derivation}>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                    Mass
                  </span>
                  <span className="mono text-[14px]">{mass.toFixed(1)} g</span>
                </div>
                <div className="flex flex-col items-stretch gap-1" style={{ paddingTop: 16 }}>
                  <Button size="sm" onClick={() => select(c.id)}>
                    {selected ? 'Selected' : 'Select'}
                  </Button>
                  <Button size="sm" onClick={() => removeComponent(c.id)}>Remove</Button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] flex-wrap" style={{ color: 'var(--ink-muted)' }}>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={(e) => updateComponent(c.id, (cc) => ({ ...cc, visible: e.target.checked }))}
                  />
                  visible
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!!c.movable?.x}
                    onChange={(e) =>
                      updateComponent(c.id, (cc) => ({
                        ...cc,
                        movable: e.target.checked
                          ? { x: true, xRange_mm: cc.movable?.xRange_mm ?? [c.x_mm - 30, c.x_mm + 30] }
                          : { x: false },
                      }))
                    }
                  />
                  movable along x
                </label>
                {c.movable?.x && c.movable.xRange_mm && (
                  <span className="mono">
                    range {c.movable.xRange_mm[0].toFixed(0)} – {c.movable.xRange_mm[1].toFixed(0)} mm
                  </span>
                )}
                <span className="ml-auto mono">{derivation}</span>
              </div>
            </Panel>
          );
        })}
      </div>
    </Window>
  );
}

function SourceEditor({
  source,
  onChange,
}: {
  source: MassSource;
  onChange: (s: MassSource) => void;
}) {
  const project = useProject((s) => s.project);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
        Mass source
      </span>
      <select
        value={source.kind}
        onChange={(e) => {
          const kind = e.target.value as MassSource['kind'];
          switch (kind) {
            case 'fixed':  onChange({ kind: 'fixed', mass_g: 10 }); break;
            case 'part':   onChange({ kind: 'part', partId: project.parts[0]?.id ?? '', count: 1 }); break;
            case 'sheet':  onChange({ kind: 'sheet', materialId: project.materials.find((m) => m.kind === 'sheet')?.id ?? '', area_mm2: 10000 }); break;
            case 'linear': onChange({ kind: 'linear', materialId: project.materials.find((m) => m.kind === 'linear')?.id ?? '', length_mm: 100 }); break;
            case 'volume': onChange({ kind: 'volume', materialId: project.materials.find((m) => m.kind === 'volume')?.id ?? '', volume_cm3: 10 }); break;
            case 'lump':   onChange({ kind: 'lump', materialId: project.materials.find((m) => m.kind === 'lump')?.id ?? '', count: 1 }); break;
          }
        }}
        className="mono"
        style={inputStyle}
      >
        <option value="fixed">Fixed mass</option>
        <option value="part">Part library</option>
        <option value="sheet">Sheet × area</option>
        <option value="linear">Linear × length</option>
        <option value="volume">Volume × density</option>
        <option value="lump">Lump × count</option>
      </select>
      <div className="flex items-center gap-1">
        {source.kind === 'fixed' && (
          <input
            type="number"
            value={source.mass_g}
            onChange={(e) => onChange({ kind: 'fixed', mass_g: parseFloat(e.target.value) || 0 })}
            className="mono w-full"
            style={inputStyle}
          />
        )}
        {source.kind === 'part' && (
          <select
            value={source.partId}
            onChange={(e) => onChange({ ...source, partId: e.target.value })}
            className="mono w-full"
            style={inputStyle}
          >
            {project.parts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.mass_g} g)</option>
            ))}
          </select>
        )}
        {source.kind === 'sheet' && (
          <>
            <select
              value={source.materialId}
              onChange={(e) => onChange({ ...source, materialId: e.target.value })}
              className="mono"
              style={{ ...inputStyle, width: '50%' }}
            >
              {project.materials.filter((m) => m.kind === 'sheet').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={source.area_mm2}
              onChange={(e) => onChange({ ...source, area_mm2: parseFloat(e.target.value) || 0 })}
              className="mono"
              style={{ ...inputStyle, width: '50%' }}
              title="area in mm²"
            />
          </>
        )}
        {source.kind === 'linear' && (
          <>
            <select
              value={source.materialId}
              onChange={(e) => onChange({ ...source, materialId: e.target.value })}
              className="mono"
              style={{ ...inputStyle, width: '50%' }}
            >
              {project.materials.filter((m) => m.kind === 'linear').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={source.length_mm}
              onChange={(e) => onChange({ ...source, length_mm: parseFloat(e.target.value) || 0 })}
              className="mono"
              style={{ ...inputStyle, width: '50%' }}
              title="length in mm"
            />
          </>
        )}
        {source.kind === 'volume' && (
          <>
            <select
              value={source.materialId}
              onChange={(e) => onChange({ ...source, materialId: e.target.value })}
              className="mono"
              style={{ ...inputStyle, width: '50%' }}
            >
              {project.materials.filter((m) => m.kind === 'volume').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={source.volume_cm3}
              onChange={(e) => onChange({ ...source, volume_cm3: parseFloat(e.target.value) || 0 })}
              className="mono"
              style={{ ...inputStyle, width: '50%' }}
              title="volume in cm³"
            />
          </>
        )}
        {source.kind === 'lump' && (
          <>
            <select
              value={source.materialId}
              onChange={(e) => onChange({ ...source, materialId: e.target.value })}
              className="mono"
              style={{ ...inputStyle, width: '60%' }}
            >
              {project.materials.filter((m) => m.kind === 'lump').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={source.count}
              onChange={(e) => onChange({ ...source, count: parseFloat(e.target.value) || 0 })}
              className="mono"
              style={{ ...inputStyle, width: '40%' }}
              title="count"
            />
          </>
        )}
      </div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--cream-card)',
  boxShadow: 'var(--shadow-bevel-in)',
  borderRadius: 3,
  padding: '2px 6px',
  fontSize: 13,
  border: 'none',
};
