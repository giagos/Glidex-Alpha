import { Window } from '../../components/Window';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { useProject } from '../../state/project';
import { useDerived } from './useDerived';
import { buildMarkdownReport, exportMarkdown } from '../../export/markdown';
import { exportPDF } from '../../export/pdf';
import { exportMassCSV } from '../../export/csv';
import { exportProjectJSON } from '../../export/json';

export function ReportView() {
  const project = useProject((s) => s.project);
  const d = useDerived(project);
  const md = buildMarkdownReport(project, d);
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 240px' }}>
      <Window title="Report (Markdown preview)">
        <pre
          className="mono text-[12px] whitespace-pre-wrap"
          style={{
            background: 'var(--cream-card)',
            boxShadow: 'var(--shadow-bevel-in)',
            padding: 12,
            borderRadius: 3,
            margin: 0,
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          {md}
        </pre>
      </Window>
      <Window title="Export">
        <div className="flex flex-col gap-2">
          <Button onClick={() => exportProjectJSON(project)}>Project JSON</Button>
          <Button onClick={() => exportMassCSV(project)}>Mass table CSV</Button>
          <Button onClick={() => exportMarkdown(project)}>Markdown report</Button>
          <Button onClick={() => navigator.clipboard.writeText(md)}>Copy markdown</Button>
          <Button variant="primary" onClick={() => exportPDF(project)}>
            PDF report
          </Button>
          <Panel inset>
            <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              SVG drawings can be exported from the Workbench view (planned).
            </div>
          </Panel>
        </div>
      </Window>
    </div>
  );
}
