// Machine categories and the spec fields suggested for each one.
// Sellers can always add their own spec rows; these are only prompts.

export type CategoryGroup = "printing" | "converting" | "packaging" | "prepress";

export interface Category {
  slug: string;
  label: string;
  /** One machine of this type, e.g. "Offset printing press" */
  singular: string;
  /** Short label for navigation */
  short: string;
  /** One-line description of what belongs here */
  hint: string;
  group: CategoryGroup;
  specs: string[];
}

export const CATEGORY_GROUPS: { id: CategoryGroup; label: string }[] = [
  { id: "printing", label: "Printing" },
  { id: "converting", label: "Converting & finishing" },
  { id: "packaging", label: "Packaging & film" },
  { id: "prepress", label: "Pre-press, auxiliary & parts" },
];

/** Suggested for every machine, after the category-specific fields. */
export const COMMON_SPECS = [
  "Power supply (V / Hz / phase)",
  "Total power (kW)",
  "Machine dimensions L × W × H (m)",
  "Machine weight (kg)",
  "Country of manufacture",
  "Serial number",
  "Last serviced",
];

export const CATEGORIES: Category[] = [
  {
    slug: "offset-printing",
    label: "Offset printing presses",
    singular: "Offset printing press",
    short: "Offset",
    hint: "Sheetfed and web offset",
    group: "printing",
    specs: [
      "Number of colours",
      "Max sheet size (mm)",
      "Min sheet size (mm)",
      "Max printing area (mm)",
      "Max speed (sheets/hr)",
      "Impression count",
      "Perfecting unit",
      "Coating unit",
      "Dampening system",
      "Plate size (mm)",
      "Remote ink control",
    ],
  },
  {
    slug: "flexo-printing",
    label: "Flexo printing machines",
    singular: "Flexo printing machine",
    short: "Flexo",
    hint: "CI, stack and inline flexo",
    group: "printing",
    specs: [
      "Press type (CI / stack / inline)",
      "Number of colours",
      "Max web width (mm)",
      "Max printing width (mm)",
      "Print repeat range (mm)",
      "Max mechanical speed (m/min)",
      "Substrates",
      "Drying system",
      "Max unwind / rewind diameter (mm)",
      "Corona treater",
      "Video inspection",
      "Sleeves / cylinders included",
      "Anilox rolls included",
    ],
  },
  {
    slug: "rotogravure-printing",
    label: "Rotogravure printing machines",
    singular: "Rotogravure printing machine",
    short: "Rotogravure",
    hint: "Gravure presses for film and paper",
    group: "printing",
    specs: [
      "Number of colours",
      "Max web width (mm)",
      "Max mechanical speed (m/min)",
      "Cylinder circumference range (mm)",
      "Drying system",
      "Unwind / rewind type",
      "Auto register control",
      "Electrostatic assist (ESA)",
      "Cylinders included",
    ],
  },
  {
    slug: "label-printing",
    label: "Label printing presses",
    singular: "Label printing press",
    short: "Label",
    hint: "Narrow-web flexo, letterpress and digital",
    group: "printing",
    specs: [
      "Print technology",
      "Max web width (mm)",
      "Number of colours",
      "Max speed (m/min)",
      "Die-cutting stations",
      "Lamination / cold foil",
      "Turret rewinder",
    ],
  },
  {
    slug: "digital-printing",
    label: "Digital printing machines",
    singular: "Digital printing machine",
    short: "Digital",
    hint: "Toner, inkjet and wide-format",
    group: "printing",
    specs: [
      "Technology (toner / inkjet)",
      "Max sheet or media size (mm)",
      "Speed (pages/min or m²/hr)",
      "Meter / click count",
      "Number of colours",
      "Duplex",
      "Print controller / RIP",
    ],
  },
  {
    slug: "screen-printing",
    label: "Screen printing machines",
    singular: "Screen printing machine",
    short: "Screen",
    hint: "Manual, semi-automatic and automatic",
    group: "printing",
    specs: [
      "Type (manual / semi-auto / automatic)",
      "Max print area (mm)",
      "Max speed (impressions/hr)",
      "Number of stations / colours",
      "Drying / curing",
    ],
  },
  {
    slug: "die-cutting",
    label: "Die cutting & creasing",
    singular: "Die cutting machine",
    short: "Die cutting",
    hint: "Flatbed, platen and rotary",
    group: "converting",
    specs: [
      "Type (flatbed / platen / rotary)",
      "Max sheet size (mm)",
      "Min sheet size (mm)",
      "Max die-cut size (mm)",
      "Max speed (sheets/hr)",
      "Max cutting pressure (tons)",
      "Stripping section",
      "Blanking section",
      "Hot foil unit",
    ],
  },
  {
    slug: "slitting-rewinding",
    label: "Slitting & rewinding",
    singular: "Slitter rewinder",
    short: "Slitting",
    hint: "Slitter rewinders and doctor rewinders",
    group: "converting",
    specs: [
      "Max web width (mm)",
      "Max unwind diameter (mm)",
      "Max rewind diameter (mm)",
      "Min slit width (mm)",
      "Max speed (m/min)",
      "Slitting method (razor / shear / score)",
      "Core sizes",
      "Unwind type (shaft / shaftless)",
    ],
  },
  {
    slug: "lamination",
    label: "Laminating machines",
    singular: "Laminating machine",
    short: "Lamination",
    hint: "Solventless, solvent, thermal and extrusion",
    group: "converting",
    specs: [
      "Type (solventless / solvent / thermal / extrusion)",
      "Max web width (mm)",
      "Max speed (m/min)",
      "Number of unwinds",
      "Drying tunnel length (m)",
      "Coating method",
    ],
  },
  {
    slug: "paper-cutting",
    label: "Paper cutting guillotines",
    singular: "Paper cutting guillotine",
    short: "Cutting",
    hint: "Programmable and hydraulic guillotines",
    group: "converting",
    specs: [
      "Cutting width (cm)",
      "Max cutting height (mm)",
      "Programmable",
      "Air table",
      "Safety light curtain",
      "Knives included",
    ],
  },
  {
    slug: "folder-gluers",
    label: "Folder gluers",
    singular: "Folder gluer",
    short: "Folder gluers",
    hint: "Straight-line, crash-lock and 4/6 corner",
    group: "converting",
    specs: [
      "Max blank width (mm)",
      "Min blank width (mm)",
      "Box styles",
      "Max belt speed (m/min)",
      "Crash-lock bottom",
      "4 / 6 corner",
      "Gluing system",
    ],
  },
  {
    slug: "coating-uv",
    label: "Coating, varnishing & UV",
    singular: "Coating / UV machine",
    short: "Coating & UV",
    hint: "UV coaters, spot UV and drying",
    group: "converting",
    specs: [
      "Type (UV coater / aqueous / spot UV)",
      "Max sheet size (mm)",
      "Max speed (sheets/hr)",
      "Curing system",
    ],
  },
  {
    slug: "foil-embossing",
    label: "Foil stamping & embossing",
    singular: "Foil stamping machine",
    short: "Foil stamping",
    hint: "Hot foil, embossing and holography",
    group: "converting",
    specs: [
      "Type (flatbed / cylinder / platen)",
      "Max sheet size (mm)",
      "Max foil area (mm)",
      "Max speed (sheets/hr)",
      "Pressure (tons)",
      "Number of foil shafts",
    ],
  },
  {
    slug: "finishing-binding",
    label: "Folding, binding & finishing",
    singular: "Finishing machine",
    short: "Finishing",
    hint: "Folders, perfect binders, stitchers",
    group: "converting",
    specs: ["Machine type", "Max sheet / book size (mm)", "Max speed", "Stations / clamps"],
  },
  {
    slug: "inspection-sheeting",
    label: "Inspection, doctoring & sheeting",
    singular: "Inspection / sheeting machine",
    short: "Inspection",
    hint: "Web inspection, doctor machines, sheeters",
    group: "converting",
    specs: ["Machine type", "Max web width (mm)", "Max speed (m/min)", "Inspection system"],
  },
  {
    slug: "bag-pouch-making",
    label: "Bag, pouch & paper bag making",
    singular: "Bag making machine",
    short: "Bag making",
    hint: "Pouches, poly bags and paper bags",
    group: "packaging",
    specs: [
      "Bag types (3-side seal, center seal, stand-up, zipper …)",
      "Max bag width (mm)",
      "Max bag length (mm)",
      "Max speed (bags/min)",
      "Material",
      "Number of lanes",
    ],
  },
  {
    slug: "corrugation",
    label: "Corrugation & carton making",
    singular: "Corrugation machine",
    short: "Corrugation",
    hint: "Corrugators, printer slotters, stitchers",
    group: "packaging",
    specs: [
      "Machine type",
      "Flute types",
      "Max board width (mm)",
      "Max speed (m/min or sheets/min)",
      "Number of ply",
      "Number of print colours",
    ],
  },
  {
    slug: "blown-film-extrusion",
    label: "Blown film & extrusion",
    singular: "Blown film line",
    short: "Extrusion",
    hint: "Blown film lines and extruders",
    group: "packaging",
    specs: [
      "Number of layers",
      "Materials (LDPE / LLDPE / HDPE / PP)",
      "Screw diameter (mm)",
      "Die diameter (mm)",
      "Max film width (mm)",
      "Output (kg/hr)",
      "Thickness range (micron)",
    ],
  },
  {
    slug: "packaging-machines",
    label: "Filling, sealing & packing",
    singular: "Packing machine",
    short: "Packing",
    hint: "Form-fill-seal, cartoning, shrink wrap",
    group: "packaging",
    specs: ["Machine type", "Speed (packs/min)", "Pack size range", "Sealing type", "Fill range (g / ml)"],
  },
  {
    slug: "prepress-ctp",
    label: "Pre-press, CTP & plate making",
    singular: "Pre-press equipment",
    short: "Pre-press",
    hint: "CTP, flexo plate makers, processors",
    group: "prepress",
    specs: [
      "Type (thermal / violet / CTcP / flexo plate)",
      "Max plate size (mm)",
      "Throughput (plates/hr)",
      "Autoloader",
      "Processor included",
      "Resolution (dpi)",
    ],
  },
  {
    slug: "auxiliary",
    label: "Auxiliary equipment",
    singular: "Auxiliary equipment",
    short: "Auxiliary",
    hint: "Compressors, chillers, plate mounters, ink kitchens",
    group: "prepress",
    specs: ["Equipment type", "Capacity", "Works with"],
  },
  {
    slug: "spare-parts",
    label: "Spare parts & tooling",
    singular: "Spare part",
    short: "Parts",
    hint: "Cylinders, anilox rolls, dies, motors",
    group: "prepress",
    specs: ["Part type", "Fits machines", "Part number", "Quantity"],
  },
];

const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string | null | undefined): Category | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export function categoryLabel(slug: string | null | undefined): string {
  return getCategory(slug)?.label ?? "Machinery";
}

export function categorySingular(slug: string | null | undefined): string {
  return getCategory(slug)?.singular ?? "Machine";
}

export function isCategorySlug(slug: unknown): slug is string {
  return typeof slug === "string" && bySlug.has(slug);
}

/** Categories shown in the header's category bar. */
export const NAV_CATEGORIES = [
  "offset-printing",
  "flexo-printing",
  "rotogravure-printing",
  "die-cutting",
  "slitting-rewinding",
  "lamination",
  "bag-pouch-making",
  "corrugation",
  "paper-cutting",
  "folder-gluers",
];
