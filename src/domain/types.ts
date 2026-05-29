import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Units (everything internal is SI-ish: mm, g, m/s, deg)              */
/* ------------------------------------------------------------------ */

export const UnitSystem = z.enum(['metric']);
export type UnitSystem = z.infer<typeof UnitSystem>;

/* ------------------------------------------------------------------ */
/* Materials — user-defined; each material has a density spec          */
/* that lets us derive mass from geometry.                             */
/* ------------------------------------------------------------------ */

export const MaterialKind = z.enum([
  'sheet',    // foam-board, balsa sheet, ply: mass per area (g/m²)
  'linear',   // spar, carbon rod, tape: mass per length (g/m)
  'volume',   // PLA, resin, foam block: mass per volume (g/cm³)
  'lump',     // glue dot, blob: lump mass (g)
]);
export type MaterialKind = z.infer<typeof MaterialKind>;

export const Material = z.object({
  id: z.string(),
  name: z.string(),
  kind: MaterialKind,
  /** g/m² for sheet, g/m for linear, g/cm³ for volume, g for lump */
  density: z.number().nonnegative(),
  /** For sheet materials, the physical thickness in mm (informational). */
  thickness_mm: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type Material = z.infer<typeof Material>;

/* ------------------------------------------------------------------ */
/* Parts library — pre-defined parts the user owns (servo, RX, ESC...).*/
/* Each instance placed on the aircraft becomes a Component.           */
/* ------------------------------------------------------------------ */

export const PartCategory = z.enum([
  'motor',
  'esc',
  'battery',
  'receiver',
  'servo',
  'electronics',
  'hardware',
  'payload',
  'other',
]);
export type PartCategory = z.infer<typeof PartCategory>;

export const Part = z.object({
  id: z.string(),
  name: z.string(),
  category: PartCategory,
  mass_g: z.number().nonnegative(),
  notes: z.string().optional(),
});
export type Part = z.infer<typeof Part>;

/* ------------------------------------------------------------------ */
/* Components — instances placed on the aircraft. Mass is either:     */
/*  - 'fixed'    : user typed a mass directly                          */
/*  - 'part'     : ref to a Part (uses Part.mass_g)                    */
/*  - 'material' : derived from material + geometry (sheet area etc.)  */
/* ------------------------------------------------------------------ */

const SheetMaterialSource = z.object({
  kind: z.literal('sheet'),
  materialId: z.string(),
  area_mm2: z.number().nonnegative(),
});
const LinearMaterialSource = z.object({
  kind: z.literal('linear'),
  materialId: z.string(),
  length_mm: z.number().nonnegative(),
});
const VolumeMaterialSource = z.object({
  kind: z.literal('volume'),
  materialId: z.string(),
  volume_cm3: z.number().nonnegative(),
});
const LumpMaterialSource = z.object({
  kind: z.literal('lump'),
  materialId: z.string(),
  count: z.number().nonnegative().default(1),
});

const FixedMassSource = z.object({
  kind: z.literal('fixed'),
  mass_g: z.number(),
});
const PartMassSource = z.object({
  kind: z.literal('part'),
  partId: z.string(),
  count: z.number().nonnegative().default(1),
});

export const MassSource = z.discriminatedUnion('kind', [
  FixedMassSource,
  PartMassSource,
  SheetMaterialSource,
  LinearMaterialSource,
  VolumeMaterialSource,
  LumpMaterialSource,
]);
export type MassSource = z.infer<typeof MassSource>;

export const ComponentKind = z.enum([
  'structure',  // wing skin, fuselage side, formers, doublers
  'spar',       // carbon rod, balsa spar, wood stringer
  'glue',       // glue lines, tape lines
  'electronics',
  'motor',
  'esc',
  'battery',
  'receiver',
  'servo',
  'payload',
  'ballast',
  'other',
]);
export type ComponentKind = z.infer<typeof ComponentKind>;

export const Movable = z.object({
  x: z.boolean().default(false),
  xRange_mm: z.tuple([z.number(), z.number()]).optional(),
});
export type Movable = z.infer<typeof Movable>;

export const Component = z.object({
  id: z.string(),
  name: z.string(),
  kind: ComponentKind,
  source: MassSource,
  /** Position along fuselage X (mm from nose, positive aft). */
  x_mm: z.number(),
  y_mm: z.number().default(0),
  z_mm: z.number().default(0),
  movable: Movable.optional(),
  visible: z.boolean().default(true),
  notes: z.string().optional(),
});
export type Component = z.infer<typeof Component>;

/* ------------------------------------------------------------------ */
/* Aircraft geometry                                                    */
/*   X axis: along fuselage, 0 at nose, positive aft.                  */
/*   Y axis: spanwise, 0 at root, positive starboard.                  */
/*   Z axis: vertical, positive up.                                    */
/* ------------------------------------------------------------------ */

export const Wing = z.object({
  span_mm: z.number().positive(),
  root_chord_mm: z.number().positive(),
  tip_chord_mm: z.number().positive(),
  sweep_deg: z.number().default(0),
  dihedral_deg: z.number().default(0),
  incidence_deg: z.number().default(0),
  /** Leading edge position of the wing root along fuselage X (mm from nose). */
  root_le_x_mm: z.number().nonnegative(),
});
export type Wing = z.infer<typeof Wing>;

export const Tail = z.object({
  span_mm: z.number().positive(),
  root_chord_mm: z.number().positive(),
  tip_chord_mm: z.number().positive(),
  root_le_x_mm: z.number().nonnegative(),
});
export type Tail = z.infer<typeof Tail>;

export const VTail = z.object({
  height_mm: z.number().positive(),
  root_chord_mm: z.number().positive(),
  tip_chord_mm: z.number().positive(),
  root_le_x_mm: z.number().nonnegative(),
});
export type VTail = z.infer<typeof VTail>;

export const Fuselage = z.object({
  length_mm: z.number().positive(),
  max_width_mm: z.number().positive(),
  max_height_mm: z.number().positive(),
});
export type Fuselage = z.infer<typeof Fuselage>;

export const BatteryBay = z.object({
  x_min_mm: z.number().nonnegative(),
  x_max_mm: z.number().nonnegative(),
  z_mm: z.number().default(0),
});
export type BatteryBay = z.infer<typeof BatteryBay>;

export const Aircraft = z.object({
  wing: Wing,
  htail: Tail,
  vtail: VTail.optional(),
  fuselage: Fuselage,
  batteryBay: BatteryBay.optional(),
});
export type Aircraft = z.infer<typeof Aircraft>;

/* ------------------------------------------------------------------ */
/* CG targets and aero parameters                                       */
/* ------------------------------------------------------------------ */

export const CGTarget = z.object({
  /** Target CG position along X (mm from nose). Computed default = 30% MAC. */
  x_mm: z.number(),
  /** Safe CG range expressed as [forward, aft] mm from nose. */
  range_mm: z.tuple([z.number(), z.number()]),
});
export type CGTarget = z.infer<typeof CGTarget>;

export const AeroParams = z.object({
  cl_max: z.number().positive().default(1.2),
  air_density_kg_m3: z.number().positive().default(1.225),
  cruise_speed_m_s: z.number().positive().default(15),
});
export type AeroParams = z.infer<typeof AeroParams>;

/* ------------------------------------------------------------------ */
/* Foam-board sheets                                                    */
/* ------------------------------------------------------------------ */

export const SheetPart = z.object({
  id: z.string(),
  name: z.string(),
  /** Outline as polygon points in mm, sheet-local frame. */
  polygon: z.array(z.tuple([z.number(), z.number()])),
  /** Placement: top-left corner of bounding box, mm from sheet origin. */
  x_mm: z.number(),
  y_mm: z.number(),
  rotation_deg: z.number().default(0),
});
export type SheetPart = z.infer<typeof SheetPart>;

export const Sheet = z.object({
  id: z.string(),
  name: z.string(),
  width_mm: z.number().positive(),
  height_mm: z.number().positive(),
  materialId: z.string().optional(),
  parts: z.array(SheetPart).default([]),
});
export type Sheet = z.infer<typeof Sheet>;

/* ------------------------------------------------------------------ */
/* Project root                                                         */
/* ------------------------------------------------------------------ */

export const ProjectMeta = z.object({
  name: z.string().default('Untitled aircraft'),
  author: z.string().default(''),
  units: UnitSystem.default('metric'),
  createdAt: z.string(),
  updatedAt: z.string(),
  appVersion: z.string().default('0.1.0'),
});
export type ProjectMeta = z.infer<typeof ProjectMeta>;

export const Project = z.object({
  meta: ProjectMeta,
  aircraft: Aircraft,
  materials: z.array(Material).default([]),
  parts: z.array(Part).default([]),
  components: z.array(Component).default([]),
  sheets: z.array(Sheet).default([]),
  target: CGTarget.optional(),
  aero: AeroParams.default({
    cl_max: 1.2,
    air_density_kg_m3: 1.225,
    cruise_speed_m_s: 15,
  }),
});
export type Project = z.infer<typeof Project>;
