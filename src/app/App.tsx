import { useMemo, useState } from 'react';
import { MenuBar, Menu } from '../components/Menu';
import { Tabs } from '../components/Tabs';
import { useProject } from '../state/project';
import { getAdapter } from '../persistence/adapter';
import { WorkbenchView } from './views/WorkbenchView';
import { GeometryView } from './views/GeometryView';
import { MaterialsView } from './views/MaterialsView';
import { PartsView } from './views/PartsView';
import { ComponentsView } from './views/ComponentsView';
import { AeroView } from './views/AeroView';
import { BallastView } from './views/BallastView';
import { SheetsView } from './views/SheetsView';
import { ReportView } from './views/ReportView';
import { exportProjectJSON } from '../export/json';
import { exportMassCSV } from '../export/csv';
import { exportMarkdown } from '../export/markdown';
import { exportPDF } from '../export/pdf';
import { defaultProject } from '../domain/defaults';

type ViewId =
  | 'workbench'
  | 'geometry'
  | 'materials'
  | 'parts'
  | 'components'
  | 'aero'
  | 'ballast'
  | 'sheets'
  | 'report';

export function App() {
  const [view, setView] = useState<ViewId>('workbench');
  const project = useProject((s) => s.project);
  const setProject = useProject((s) => s.setProject);
  const loadFromJson = useProject((s) => s.loadFromJson);

  const onNew = () => {
    if (!confirm('Discard current project and start a new one?')) return;
    setProject(defaultProject());
  };

  const onOpen = async () => {
    const a = await getAdapter();
    const res = await a.openProject();
    if (res.ok) {
      loadFromJson(JSON.stringify(res.project), res.path);
    } else if ('error' in res && res.error) {
      alert('Failed to open project: ' + res.error);
    }
  };

  const onSave = async () => {
    const a = await getAdapter();
    await a.saveProject(project);
  };

  const fileMenu = [
    { label: 'New project…', onSelect: onNew },
    { label: 'Open…', onSelect: onOpen },
    { label: 'Save…', onSelect: onSave },
    { separator: true, label: '' },
    { label: 'Export project JSON', onSelect: () => exportProjectJSON(project) },
    { label: 'Export mass table (CSV)', onSelect: () => exportMassCSV(project) },
    { label: 'Export report (Markdown)', onSelect: () => exportMarkdown(project) },
    { label: 'Export report (PDF)', onSelect: () => exportPDF(project) },
  ];

  const helpMenu = [
    {
      label: 'About Glidex Alpha',
      onSelect: () =>
        alert(
          'Glidex Alpha v0.1\n\nA practical RC aircraft design workbench:\n' +
            'geometry, mass, CG, basic aero, drawings, foam-board planning.',
        ),
    },
  ];

  const tabs = useMemo(
    () =>
      [
        { id: 'workbench', label: 'Workbench' },
        { id: 'geometry', label: 'Geometry' },
        { id: 'materials', label: 'Materials' },
        { id: 'parts', label: 'Parts' },
        { id: 'components', label: 'Components' },
        { id: 'aero', label: 'Aero' },
        { id: 'ballast', label: 'Balance' },
        { id: 'sheets', label: 'Foam sheets' },
        { id: 'report', label: 'Report' },
      ] as { id: ViewId; label: string }[],
    [],
  );

  return (
    <div className="paper flex flex-col" style={{ height: '100vh' }}>
      <MenuBar>
        <Menu label="File" items={fileMenu} />
        <Menu label="Help" items={helpMenu} />
        <div className="flex-1" />
        <span
          className="mono text-[11px] mr-2"
          style={{ color: 'var(--ink-muted)' }}
        >
          {project.meta.name || 'untitled'} · v{project.meta.appVersion}
        </span>
      </MenuBar>

      <div className="px-3 pt-3">
        <Tabs value={view} onChange={setView} tabs={tabs} />
      </div>

      <div
        className="flex-1 min-h-0 overflow-auto p-3"
        style={{ background: 'var(--cream-bg)' }}
      >
        {view === 'workbench' && <WorkbenchView />}
        {view === 'geometry' && <GeometryView />}
        {view === 'materials' && <MaterialsView />}
        {view === 'parts' && <PartsView />}
        {view === 'components' && <ComponentsView />}
        {view === 'aero' && <AeroView />}
        {view === 'ballast' && <BallastView />}
        {view === 'sheets' && <SheetsView />}
        {view === 'report' && <ReportView />}
      </div>

      <footer
        className="px-3 py-1 text-[11px] flex items-center gap-3"
        style={{
          background: 'var(--cream-panel)',
          borderTop: '1px solid var(--border-dark)',
          boxShadow: 'inset 0 1px 0 var(--bevel-hi)',
          color: 'var(--ink-muted)',
        }}
      >
        <span>Glidex Alpha</span>
        <span>·</span>
        <span>{project.components.length} components</span>
        <span>·</span>
        <span>{project.materials.length} materials</span>
        <span>·</span>
        <span>{project.parts.length} parts</span>
      </footer>
    </div>
  );
}
