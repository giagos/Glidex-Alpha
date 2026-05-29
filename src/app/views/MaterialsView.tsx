import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { useProject, newId } from '../../state/project';
import type { Material, MaterialKind } from '../../domain/types';

const kindOptions: { id: MaterialKind; label: string; unit: string }[] = [
  { id: 'sheet', label: 'Sheet (foam, balsa, ply)', unit: 'g/m²' },
  { id: 'linear', label: 'Linear (spar, tape, glue line)', unit: 'g/m' },
  { id: 'volume', label: 'Volume (PLA, resin)', unit: 'g/cm³' },
  { id: 'lump', label: 'Lump (per blob/dot)', unit: 'g' },
];

export function MaterialsView() {
  const materials = useProject((s) => s.project.materials);
  const addMaterial = useProject((s) => s.addMaterial);
  const updateMaterial = useProject((s) => s.updateMaterial);
  const removeMaterial = useProject((s) => s.removeMaterial);

  const onAdd = () => {
    const m: Material = {
      id: newId('mat'),
      name: 'New material',
      kind: 'sheet',
      density: 200,
    };
    addMaterial(m);
  };

  return (
    <Window
      title="Materials library"
      toolbar={<Button size="sm" onClick={onAdd}>+ Add</Button>}
    >
      <div className="flex flex-col gap-2">
        {materials.length === 0 && (
          <Panel inset>
            <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              No materials yet. Add one to start using sheet/linear/volume mass derivation.
            </span>
          </Panel>
        )}
        {materials.map((m) => {
          const k = kindOptions.find((o) => o.id === m.kind)!;
          return (
            <Panel key={m.id}>
              <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr auto' }}>
                <Field label="Name" value={m.name}
                  onValueChange={(v) => updateMaterial(m.id, (mm) => ({ ...mm, name: v }))} />
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                    Kind
                  </span>
                  <select
                    value={m.kind}
                    onChange={(e) =>
                      updateMaterial(m.id, (mm) => ({ ...mm, kind: e.target.value as MaterialKind }))
                    }
                    className="mono"
                    style={selectStyle}
                  >
                    {kindOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Density" unit={k.unit} value={m.density}
                  onValueChange={(v) => updateMaterial(m.id, (mm) => ({ ...mm, density: parseFloat(v) || 0 }))} />
                <Field label="Thick." unit="mm" value={m.thickness_mm ?? ''}
                  onValueChange={(v) =>
                    updateMaterial(m.id, (mm) => ({
                      ...mm,
                      thickness_mm: v === '' ? undefined : parseFloat(v) || 0,
                    }))
                  } />
                <div className="flex items-end pb-1">
                  <Button size="sm" onClick={() => removeMaterial(m.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </Panel>
          );
        })}
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
