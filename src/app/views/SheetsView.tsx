import { useState } from 'react';
import { Window } from '../../components/Window';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { useProject, newId } from '../../state/project';
import { autoArrange } from '../../domain/sheets';
import type { Sheet, SheetPart } from '../../domain/types';

export function SheetsView() {
  const sheets = useProject((s) => s.project.sheets);
  const setProject = useProject((s) => s.setProject);
  const project = useProject((s) => s.project);
  const [activeId, setActiveId] = useState<string | undefined>(sheets[0]?.id);

  const active = sheets.find((s) => s.id === activeId);

  const addSheet = () => {
    const s: Sheet = {
      id: newId('sheet'),
      name: `Sheet ${sheets.length + 1}`,
      width_mm: 762,
      height_mm: 508,
      parts: [],
    };
    setProject({ ...project, sheets: [...sheets, s] });
    setActiveId(s.id);
  };

  const updateSheet = (id: string, mut: (s: Sheet) => Sheet) => {
    setProject({
      ...project,
      sheets: sheets.map((s) => (s.id === id ? mut(s) : s)),
    });
  };

  const addRectPart = () => {
    if (!active) return;
    const p: SheetPart = {
      id: newId('sp'),
      name: 'rect',
      polygon: [[0, 0], [200, 0], [200, 80], [0, 80]],
      x_mm: 10,
      y_mm: 10,
      rotation_deg: 0,
    };
    updateSheet(active.id, (s) => ({ ...s, parts: [...s.parts, p] }));
  };

  const arrange = () => {
    if (!active) return;
    updateSheet(active.id, (s) => ({ ...s, parts: autoArrange(s) }));
  };

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '220px 1fr' }}>
      <Window
        title="Sheets"
        toolbar={<Button size="sm" onClick={addSheet}>+ Add</Button>}
      >
        <div className="flex flex-col gap-1">
          {sheets.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className="text-left px-2 py-1"
              style={{
                background: s.id === activeId ? 'var(--cream-card)' : 'transparent',
                boxShadow: s.id === activeId ? 'var(--shadow-bevel-in)' : 'none',
                borderRadius: 3,
                cursor: 'pointer',
                color: 'var(--ink)',
                fontSize: 13,
                border: 'none',
              }}
            >
              <div>{s.name}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                {s.width_mm} × {s.height_mm} mm · {s.parts.length} parts
              </div>
            </button>
          ))}
          {sheets.length === 0 && (
            <Panel inset>
              <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                No sheets yet. Add one to start a foam-board layout.
              </span>
            </Panel>
          )}
        </div>
      </Window>

      {active && (
        <Window
          title={`Sheet: ${active.name}`}
          toolbar={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={addRectPart}>+ Rect part</Button>
              <Button size="sm" onClick={arrange}>Auto-arrange</Button>
            </div>
          }
        >
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Field label="Name" value={active.name}
              onValueChange={(v) => updateSheet(active.id, (s) => ({ ...s, name: v }))} />
            <Field label="Width" unit="mm" value={active.width_mm}
              onValueChange={(v) => updateSheet(active.id, (s) => ({ ...s, width_mm: parseFloat(v) || 0 }))} />
            <Field label="Height" unit="mm" value={active.height_mm}
              onValueChange={(v) => updateSheet(active.id, (s) => ({ ...s, height_mm: parseFloat(v) || 0 }))} />
          </div>
          <SheetCanvas sheet={active} />
        </Window>
      )}
    </div>
  );
}

function SheetCanvas({ sheet }: { sheet: Sheet }) {
  const padding = 10;
  const maxW = 900;
  const scale = Math.min(maxW / sheet.width_mm, 500 / sheet.height_mm);
  const w = sheet.width_mm * scale + padding * 2;
  const h = sheet.height_mm * scale + padding * 2;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ background: 'var(--cream-card)', boxShadow: 'var(--shadow-bevel-in)', borderRadius: 4 }}
    >
      <rect
        x={padding}
        y={padding}
        width={sheet.width_mm * scale}
        height={sheet.height_mm * scale}
        fill="var(--cream-bg)"
        stroke="var(--border-dark)"
        strokeWidth={1.5}
      />
      {sheet.parts.map((p) => {
        const isOverflow = p.x_mm < -1000;
        if (isOverflow) return null;
        const pts = p.polygon
          .map(([x, y]) => `${padding + (p.x_mm + x) * scale},${padding + (p.y_mm + y) * scale}`)
          .join(' ');
        return (
          <polygon
            key={p.id}
            points={pts}
            fill="var(--cream-inset)"
            stroke="var(--accent-warm)"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}
