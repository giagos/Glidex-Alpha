import { create } from 'zustand';
import type { Project, Component, Material, Part } from '../domain/types';
import { defaultProject } from '../domain/defaults';
import { Project as ProjectSchema } from '../domain/types';

interface State {
  project: Project;
  filePath?: string;
  dirty: boolean;
  selectedComponentId?: string;

  setProject: (p: Project) => void;
  loadFromJson: (json: string, filePath?: string) => { ok: true } | { ok: false; error: string };
  markClean: (filePath?: string) => void;

  updateAircraft: (mut: (a: Project['aircraft']) => Project['aircraft']) => void;
  updateAero: (mut: (a: Project['aero']) => Project['aero']) => void;
  setTarget: (t: Project['target']) => void;

  addComponent: (c: Component) => void;
  updateComponent: (id: string, mut: (c: Component) => Component) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id?: string) => void;

  addMaterial: (m: Material) => void;
  updateMaterial: (id: string, mut: (m: Material) => Material) => void;
  removeMaterial: (id: string) => void;

  addPart: (p: Part) => void;
  updatePart: (id: string, mut: (p: Part) => Part) => void;
  removePart: (id: string) => void;
}

const touch = (p: Project): Project => ({
  ...p,
  meta: { ...p.meta, updatedAt: new Date().toISOString() },
});

export const useProject = create<State>((set) => ({
  project: defaultProject(),
  dirty: false,

  setProject: (p) => set({ project: touch(p), dirty: true }),

  loadFromJson: (json, filePath) => {
    try {
      const parsed = ProjectSchema.parse(JSON.parse(json));
      set({ project: parsed, filePath, dirty: false });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  markClean: (filePath) => set((s) => ({ filePath: filePath ?? s.filePath, dirty: false })),

  updateAircraft: (mut) =>
    set((s) => ({
      project: touch({ ...s.project, aircraft: mut(s.project.aircraft) }),
      dirty: true,
    })),

  updateAero: (mut) =>
    set((s) => ({
      project: touch({ ...s.project, aero: mut(s.project.aero) }),
      dirty: true,
    })),

  setTarget: (t) =>
    set((s) => ({ project: touch({ ...s.project, target: t }), dirty: true })),

  addComponent: (c) =>
    set((s) => ({
      project: touch({ ...s.project, components: [...s.project.components, c] }),
      dirty: true,
      selectedComponentId: c.id,
    })),

  updateComponent: (id, mut) =>
    set((s) => ({
      project: touch({
        ...s.project,
        components: s.project.components.map((c) => (c.id === id ? mut(c) : c)),
      }),
      dirty: true,
    })),

  removeComponent: (id) =>
    set((s) => ({
      project: touch({
        ...s.project,
        components: s.project.components.filter((c) => c.id !== id),
      }),
      dirty: true,
      selectedComponentId:
        s.selectedComponentId === id ? undefined : s.selectedComponentId,
    })),

  selectComponent: (id) => set({ selectedComponentId: id }),

  addMaterial: (m) =>
    set((s) => ({
      project: touch({ ...s.project, materials: [...s.project.materials, m] }),
      dirty: true,
    })),
  updateMaterial: (id, mut) =>
    set((s) => ({
      project: touch({
        ...s.project,
        materials: s.project.materials.map((m) => (m.id === id ? mut(m) : m)),
      }),
      dirty: true,
    })),
  removeMaterial: (id) =>
    set((s) => ({
      project: touch({
        ...s.project,
        materials: s.project.materials.filter((m) => m.id !== id),
      }),
      dirty: true,
    })),

  addPart: (p) =>
    set((s) => ({
      project: touch({ ...s.project, parts: [...s.project.parts, p] }),
      dirty: true,
    })),
  updatePart: (id, mut) =>
    set((s) => ({
      project: touch({
        ...s.project,
        parts: s.project.parts.map((p) => (p.id === id ? mut(p) : p)),
      }),
      dirty: true,
    })),
  removePart: (id) =>
    set((s) => ({
      project: touch({
        ...s.project,
        parts: s.project.parts.filter((p) => p.id !== id),
      }),
      dirty: true,
    })),
}));

export function newId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
