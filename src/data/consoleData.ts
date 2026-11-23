import {
  AgencyData,
  BlockedPersonnel,
  CameraOverview,
  ExactLocation,
  FacilityType,
  FeedState,
  IncidentRecord,
  MonthlyTrendsData,
  RegionName,
  SecurityCompany,
  ValidationSummary
} from '../types/console';

export const NOV_CUT = '2026-10-11';
export const BASECAM = '2026-11-16D';

export const COORDINATORS: Record<RegionName, string> = {
  'GYE-SALINAS-MILAGRO': 'Byron Carrera',
  'COSTA': 'Tyrone Intriago',
  'UIO-IBARRA': 'Israel Andrade',
  'SIERRA-PUYO': 'Rodolfo Carrera'
};

export const FACILITY_TYPES: Record<string, FacilityType> = {
  'Planta Tesalia GYE': 'PLANTA',
  'Planta Milagro': 'PLANTA',
  'Planta Machachi': 'PLANTA',
  'Planta y Agencia Machala': 'PLANTA + AGENCIA',
  'Bodega MEMX Quito': 'BODEGA',
  'Edificio WorQ': 'EDIFICIO CORPORATIVO',
  'Agencia Norte GYE': 'AGENCIA',
  'Agencia Sur GYE': 'AGENCIA',
  'Agencia Salinas': 'AGENCIA',
  'Agencia Manta': 'AGENCIA',
  'Agencia Quevedo': 'AGENCIA',
  'Agencia Atacames': 'AGENCIA',
  'Agencia Santo Domingo': 'AGENCIA',
  'Agencia Ibarra': 'AGENCIA',
  'Agencia Quito Norte': 'AGENCIA',
  'Agencia Quito Sur': 'AGENCIA',
  'Agencia Ambato': 'AGENCIA',
  'Agencia Cuenca': 'AGENCIA',
  'Agencia Latacunga': 'AGENCIA',
  'Agencia Puyo': 'AGENCIA',
  'Agencia Loja': 'AGENCIA'
};

export const FACILITY_DESCRIPTIONS: Record<string, string> = {
  'Bodega MEMX Quito': 'Bodega donde se guardan y reparan equipos de frío; también se almacenan equipos de baja.',
  'Planta y Agencia Machala': 'Opera simultáneamente como planta de distribución y agencia comercial.',
  'Planta Tesalia GYE': 'Principal complejo industrial y sede matriz operativa en Guayaquil.',
  'Planta Milagro': 'Centro de producción y distribución en la cuenca del Guayas.',
  'Planta Machachi': 'Planta histórica de manantiales y producción en la serranía ecuatoriana.',
  'Edificio WorQ': 'Centro corporativo y oficinas administrativas en Guayaquil.'
};

export const SECURITY_COMPANIES: Record<string, SecurityCompany> = {
  'Planta Machachi': 'LIDERMAN',
  'Agencia Quito Norte': 'LIDERMAN',
  'Agencia Quito Sur': 'LIDERMAN',
  'Bodega MEMX Quito': 'LIDERMAN',
  'Agencia Ibarra': 'HUDSON SECURITY',
  'Planta Tesalia GYE': 'LIDERMAN',
  'Agencia Norte GYE': 'LIDERMAN',
  'Agencia Sur GYE': 'LIDERMAN',
  'Edificio WorQ': 'LIDERMAN',
  'Planta Milagro': 'LIDERMAN',
  'Agencia Salinas': 'CAJAMARCA',
  'Planta y Agencia Machala': 'LIDERMAN',
  'Agencia Cuenca': 'CAJAMARCA',
  'Agencia Loja': 'CONTROLRISK',
  'Agencia Ambato': 'CONTROLRISK',
  'Agencia Latacunga': 'CAJAMARCA',
  'Agencia Puyo': 'CAJAMARCA',
  'Agencia Manta': 'LIDERMAN',
  'Agencia Atacames': 'CONTROLRISK',
  'Agencia Quevedo': 'CONTROLRISK',
  'Agencia Santo Domingo': 'CONTROLRISK'
};

export const EXACT_COORDINATES: Record<string, ExactLocation> = {
  'Planta Machachi': { la: -0.498833, lo: -78.540333, dms: "0°29'55.8\"S 78°32'25.2\"W" },
  'Agencia Quito Norte': { la: -0.104944, lo: -78.436417, dms: "0°06'17.8\"S 78°26'11.1\"W" },
  'Agencia Quito Sur': { la: -0.294528, lo: -78.540444, dms: "0°17'40.3\"S 78°32'25.6\"W" },
  'Bodega MEMX Quito': { la: -0.270917, lo: -78.531611, dms: "0°16'15.3\"S 78°31'53.8\"W" },
  'Agencia Ibarra': { la: 0.314861, lo: -78.223917, dms: "0°18'53.5\"N 78°13'26.1\"W" },
  'Planta Tesalia GYE': { la: -2.122611, lo: -79.931833, dms: "2°07'21.4\"S 79°55'54.6\"W" },
  'Agencia Norte GYE': { la: -2.121472, lo: -79.928444, dms: "2°07'17.3\"S 79°55'42.4\"W" },
  'Agencia Sur GYE': { la: -2.190194, lo: -79.975306, dms: "2°11'24.7\"S 79°58'31.1\"W" },
  'Edificio WorQ': { la: -2.150861, lo: -79.906361, dms: "2°09'03.1\"S 79°54'22.9\"W" },
  'Planta Milagro': { la: -2.1635, lo: -79.553417, dms: "2°09'48.6\"S 79°33'12.3\"W" },
  'Agencia Salinas': { la: -2.229583, lo: -80.881222, dms: "2°13'46.5\"S 80°52'52.4\"W" },
  'Planta y Agencia Machala': { la: -3.292139, lo: -79.910806, dms: "3°17'31.7\"S 79°54'38.9\"W" },
  'Agencia Cuenca': { la: -2.876806, lo: -78.976389, dms: "2°52'36.5\"S 78°58'35.0\"W" },
  'Agencia Loja': { la: -3.947861, lo: -79.219861, dms: "3°56'52.3\"S 79°13'11.5\"W" },
  'Agencia Ambato': { la: -1.272694, lo: -78.655972, dms: "1°16'21.7\"S 78°39'21.5\"W" },
  'Agencia Latacunga': { la: -0.979583, lo: -78.606611, dms: "0°58'46.5\"S 78°36'23.8\"W" },
  'Agencia Puyo': { la: -1.492861, lo: -78.002, dms: "1°29'34.3\"S 78°00'07.2\"W" },
  'Agencia Manta': { la: -1.009056, lo: -80.687389, dms: "1°00'32.6\"S 80°41'14.6\"W" },
  'Agencia Atacames': { la: 0.889361, lo: -79.797417, dms: "0°53'21.7\"N 79°47'50.7\"W" },
  'Agencia Quevedo': { la: -0.969083, lo: -79.426444, dms: "0°58'08.7\"S 79°25'35.2\"W" },
  'Agencia Santo Domingo': { la: -0.242222, lo: -79.195028, dms: "0°14'32.0\"S 79°11'42.1\"W" }
};

export const CATEGORY_LABELS = [
  'Seguridad / Delito',
  'Accidente / Emergencia',
  'Cámaras / Sistemas',
  'Rutas / Vehículos',
  'Accesos / Personal',
  'Otros',
  'Liquidaciones',
  'Rutas pendientes',
  'Incidentes',
  'Accidente vial',
  'Delitos',
  'Productos faltantes',
  'Decomisos',
  'Intrusión',
  'Pérdida de visualización',
  'Equipos',
  'T1',
  'T2',
  'Bloqueos',
  'Mal comportamiento',
  'Mala práctica'
];

export const STATUS_LABELS = ['En proceso', 'Cerrada', 'Comunicado / otro'];

export const RAW_REGIONS_DATA: Record<RegionName, AgencyData[]> = {
  'GYE-SALINAS-MILAGRO': [
    { a: 'Agencia Norte GYE', loc: 'Guayaquil', n: 204, c: [51, 5, 19, 109, 11, 9], s: [192, 4, 8], dc: 768, bl: [201, 43], sp: [560, 7] },
    { a: 'Agencia Sur GYE', loc: 'Guayaquil', n: 143, c: [16, 5, 12, 81, 17, 12], s: [133, 4, 6], dc: 6, bl: [200, 44], sp: [534, 33] },
    { a: 'Planta Tesalia GYE', loc: 'Guayaquil', n: 137, c: [9, 19, 33, 46, 12, 18], s: [97, 17, 23], dc: 0, sp: [563, 4] },
    { a: 'Planta Milagro', loc: 'Milagro', n: 59, c: [8, 2, 15, 12, 18, 4], s: [46, 6, 7], dc: 0, sp: [233, 334] },
    { a: 'Agencia Salinas', loc: 'Santa Elena', n: 29, c: [6, 0, 6, 16, 0, 1], s: [22, 4, 3], dc: 127, bl: [70, 174], sp: [54, 513] },
    { a: 'Edificio WorQ', loc: 'Guayaquil', n: 2, c: [0, 0, 1, 0, 1, 0], s: [2, 0, 0], sp: [165, 402] }
  ],
  'COSTA': [
    { a: 'Agencia Manta', loc: 'Manabí', n: 26, c: [7, 1, 6, 7, 2, 3], s: [23, 1, 2], dc: 741, bl: [234, 10], sp: [191, 376] },
    { a: 'Agencia Quevedo', loc: 'Quevedo', n: 18, c: [1, 2, 5, 6, 4, 0], s: [16, 2, 0], dc: 20, bl: [75, 169], sp: [125, 442] },
    { a: 'Agencia Atacames', loc: 'Esmeraldas', n: 13, c: [2, 1, 7, 0, 2, 1], s: [10, 1, 2], dc: 324, bl: [185, 59], sp: [61, 506] },
    { a: 'Agencia Santo Domingo', loc: 'Santo Domingo', n: 6, c: [0, 0, 4, 0, 1, 1], s: [6, 0, 0], dc: 263, bl: [162, 82], sp: [84, 483] }
  ],
  'UIO-IBARRA': [
    { a: 'Agencia Ibarra', loc: 'Ibarra', n: 12, c: [3, 2, 3, 2, 1, 1], s: [7, 2, 3], dc: 4, bl: [60, 184], sp: [67, 500] },
    { a: 'Planta Machachi', loc: 'Machachi', n: 12, c: [1, 0, 11, 0, 0, 0], s: [8, 4, 0], dc: 0, sp: [277, 290] },
    { a: 'Agencia Quito Norte', loc: 'Quito', n: 6, c: [1, 0, 3, 0, 1, 1], s: [4, 2, 0], dc: 0, bl: [193, 51], sp: [449, 118] },
    { a: 'Agencia Quito Sur', loc: 'Quito', n: 6, c: [0, 0, 5, 0, 0, 1], s: [6, 0, 0], dc: 0, bl: [193, 51], sp: [435, 132] },
    { a: 'Bodega MEMX Quito', loc: 'Quito', n: 3, c: [0, 0, 3, 0, 0, 0], s: [2, 1, 0], sp: [435, 132] }
  ],
  'SIERRA-PUYO': [
    { a: 'Agencia Ambato', loc: 'Ambato', n: 13, c: [1, 2, 6, 2, 1, 1], s: [8, 3, 2], dc: 96, bl: [179, 65], sp: [86, 481] },
    { a: 'Planta y Agencia Machala', loc: 'Machala', n: 11, c: [0, 3, 2, 4, 2, 0], s: [9, 1, 1], dc: 783, bl: [80, 164], sp: [113, 454] },
    { a: 'Agencia Cuenca', loc: 'Cuenca', n: 6, c: [2, 0, 3, 1, 0, 0], s: [4, 1, 1], dc: 0, bl: [118, 126], sp: [75, 492] },
    { a: 'Agencia Latacunga', loc: 'Latacunga', n: 6, c: [1, 0, 4, 0, 0, 1], s: [5, 0, 1], dc: 35, bl: [53, 191], sp: [76, 491] },
    { a: 'Agencia Puyo', loc: 'Puyo', n: 5, c: [0, 0, 4, 0, 0, 1], s: [0, 3, 2], bl: [28, 216], sp: [4, 563] },
    { a: 'Agencia Loja', loc: 'Loja', n: 3, c: [0, 0, 1, 2, 0, 0], s: [3, 0, 0], dc: 1, bl: [38, 206], sp: [224, 343] }
  ]
};

export const CAMERAS_INITIAL: CameraOverview = {
  op: 617,
  no: 2,
  d: '16/11',
  sites: {
    'Agencia Ambato': [20, 0],
    'Agencia Atacames': [20, 0],
    'Agencia Cuenca': [18, 0],
    'Agencia Ibarra': [15, 0],
    'Agencia Latacunga': [11, 0],
    'Agencia Loja': [21, 0],
    'Agencia Manta': [19, 1],
    'Agencia Norte GYE': [40, 1],
    'Agencia Puyo': [12, 0],
    'Agencia Quevedo': [23, 0],
    'Agencia Quito Norte': [26, 0],
    'Agencia Quito Sur': [24, 0],
    'Agencia Salinas': [17, 0],
    'Agencia Santo Domingo': [14, 0],
    'Agencia Sur GYE': [29, 0],
    'Bodega MEMX Quito': [14, 0],
    'Edificio WorQ': [17, 0],
    'Planta Machachi': [62, 0],
    'Planta Milagro': [18, 0],
    'Planta Tesalia GYE': [173, 0],
    'Planta y Agencia Machala': [24, 0]
  }
};

export const MONTHLY_TRENDS: MonthlyTrendsData = {
  dc: [
    { m: 'ENE', t: 449 }, { m: 'FEB', t: 592 }, { m: 'MAR', t: 310 }, { m: 'ABR', t: 58 },
    { m: 'MAY', t: 296 }, { m: 'JUN', t: 182 }, { m: 'JUL', t: 367 }, { m: 'AGO', t: 559 },
    { m: 'SEP', t: 234 }, { m: 'OCT', t: 184 }, { m: 'NOV', t: 119 }
  ],
  bl: [
    { m: 'ENE', pct: 53.0 }, { m: 'FEB', pct: 53.9 }, { m: 'MAR', pct: 55.7 }, { m: 'ABR', pct: 53.9 },
    { m: 'MAY', pct: 47.3 }, { m: 'JUN', pct: 55.7 }, { m: 'JUL', pct: 54.2 }, { m: 'AGO', pct: 51.6 },
    { m: 'SEP', pct: 54.2 }, { m: 'OCT', pct: 53.8 }, { m: 'NOV', pct: 52.3 }
  ],
  sp: [
    { m: 'ENE', pct: 44.1 }, { m: 'FEB', pct: 42.3 }, { m: 'MAR', pct: 42.9 }, { m: 'ABR', pct: 42.3 },
    { m: 'MAY', pct: 34.2 }, { m: 'JUN', pct: 31.5 }, { m: 'JUL', pct: 41.9 }, { m: 'AGO', pct: 42.4 },
    { m: 'SEP', pct: 43.0 }, { m: 'OCT', pct: 39.1 }, { m: 'NOV', pct: 39.7 }
  ],
  cam: [
    { m: 'ENE', no: 3.03, pct: 99.49, n: 62, cams: 600 },
    { m: 'FEB', no: 6.33, pct: 98.95, n: 55, cams: 605 },
    { m: 'MAR', no: 1.71, pct: 99.72, n: 62, cams: 605 },
    { m: 'ABR', no: 3.40, pct: 99.44, n: 60, cams: 607 },
    { m: 'MAY', no: 5.60, pct: 99.08, n: 62, cams: 607 },
    { m: 'JUN', no: 2.41, pct: 99.60, n: 59, cams: 607 },
    { m: 'JUL', no: 1.41, pct: 99.77, n: 61, cams: 607 },
    { m: 'AGO', no: 1.61, pct: 99.73, n: 62, cams: 609 },
    { m: 'SEP', no: 1.33, pct: 99.78, n: 60, cams: 612 },
    { m: 'OCT', no: 3.40, pct: 99.45, n: 50, cams: 618 },
    { m: 'NOV', no: 6.39, pct: 98.97, n: 31, cams: 619 }
  ]
};

export const BLOCKED_PERSONNEL: BlockedPersonnel = {
  bloq: 176,
  desb: 28,
  mot: [
    ['DESVINCULACION', 22],
    ['INCUMPLIMIENTO DE NORMAS', 17],
    ['ANTECEDENTES PENALES', 12],
    ['CONDUCTA INAPROPIADA', 9],
    ['BLOQUEO NIVEL NACIONAL', 7]
  ],
  emp: [
    ['MACCARGO', 63],
    ['TRANSRRECARGO', 42],
    ['EXACTOCARGA', 19],
    ['VENPARGLOBAL', 9],
    ['TERCERO', 4]
  ],
  yr: [
    [2024, 2],
    [2025, 86],
    [2026, 88]
  ]
};

export const VALIDATIONS: ValidationSummary = {
  cur: '2026',
  prev: '2025',
  p25: 7373,
  asof: '2026-11-16',
  y: {
    '2025': {
      tot: 8402,
      nd: 0,
      m: [751, 810, 661, 713, 775, 788, 756, 739, 507, 567, 836, 499],
      tipo: [1876, 1896, 612, 86, 193, 3739],
      ag: {
        'Planta Tesalia GYE': 2407,
        'Planta Milagro': 562,
        'Agencia Manta': 524,
        'Agencia Norte GYE': 457,
        'Agencia Sur GYE': 395,
        'Agencia Santo Domingo': 308,
        'Agencia Quevedo': 249,
        'Agencia Atacames': 197,
        'Agencia Salinas': 117,
        'Agencia Cuenca': 24,
        'Planta Machachi': 21,
        'Planta y Agencia Machala': 17,
        'Edificio WorQ': 2
      },
      multi: { 'GYE-SALINAS-MILAGRO': 3061, 'UIO-IBARRA': 2, 'COSTA': 23 },
      none: 36,
      al: 75
    },
    '2026': {
      tot: 9091,
      nd: 0,
      m: [810, 857, 1137, 981, 711, 782, 990, 626, 775, 1064, 358, 0],
      tipo: [3940, 3723, 513, 197, 237, 481],
      ag: {
        'Planta Tesalia GYE': 4446,
        'Agencia Norte GYE': 1154,
        'Agencia Sur GYE': 944,
        'Planta Milagro': 860,
        'Agencia Manta': 531,
        'Agencia Quevedo': 198,
        'Agencia Atacames': 185,
        'Agencia Santo Domingo': 145,
        'Agencia Salinas': 137,
        'Planta Machachi': 67,
        'Planta y Agencia Machala': 18,
        'Agencia Ambato': 4,
        'Agencia Loja': 2,
        'Agencia Cuenca': 1,
        'Agencia Quito Norte': 1
      },
      multi: { 'GYE-SALINAS-MILAGRO': 123, 'UIO-IBARRA': 51 },
      none: 224,
      al: 108
    }
  }
};

export const VALIDATION_TYPES = [
  'Proveedores',
  'Contratistas',
  'Visitas',
  'Visitas técnicas',
  'Transportistas',
  'Otros / Sin tipo'
];

export const AUDIT_REPORTS_DATA = [
  { id: "r103gij9", a: "Agencia Sur GYE", at: "2026-10-17T22:51:23.908Z", d: "2026-06-28" },
  { id: "r10mc0he", a: "Planta Tesalia GYE", at: "2026-10-17T22:53:22.541Z", d: "2026-08-25" },
  { id: "r10mvppd", a: "Agencia Ambato", at: "2026-10-17T22:57:48.117Z", d: "2026-03-14" },
  { id: "r10vzn7", a: "Agencia Ibarra", at: "2026-10-17T22:51:56.557Z", d: "2026-07-31" },
  { id: "r113mw7d", a: "Agencia Norte GYE", at: "2026-10-17T22:54:10.957Z", d: "2026-09-09" },
  { id: "r11u525c", a: "Agencia Manta", at: "2026-10-17T22:49:29.621Z", d: null },
  { id: "r12jci1v", a: "Agencia Loja", at: "2026-10-17T22:59:14.229Z", d: "2026-01-27" },
  { id: "r132zgup", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:48.117Z", d: "2026-04-03" },
  { id: "r136wcge", a: "Agencia Ibarra", at: "2026-10-17T22:51:48.373Z", d: "2026-07-17" },
  { id: "r13gefkz", a: "Planta Milagro", at: "2026-10-17T22:56:58.989Z", d: "2026-06-06" },
  { id: "r13otn9a", a: "Agencia Norte GYE", at: "2026-10-17T22:52:27.285Z", d: "2026-08-29" },
  { id: "r14sdot6", a: "Agencia Ambato", at: "2026-10-17T22:49:44.117Z", d: "2026-03-28" },
  { id: "r14uk9re", a: "Edificio WorQ", at: "2026-10-17T22:53:30.309Z", d: "2026-09-02" },
  { id: "r1565ngf", a: "Agencia Norte GYE", at: "2026-10-17T22:57:26.100Z", d: "2026-04-30" },
  { id: "r159jsp0", a: "Agencia Cuenca", at: "2026-10-17T22:57:06.885Z", d: "2026-04-28" },
  { id: "r15bvp0e", a: "Agencia Norte GYE", at: "2026-10-17T22:49:44.117Z", d: "2026-03-31" },
  { id: "r16gcpvg", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:06.885Z", d: "2026-05-24" },
  { id: "r16ps0w4", a: "Planta Tesalia GYE", at: "2026-10-17T22:59:01.413Z", d: "2026-11-10" },
  { id: "r16ps17j", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:37.477Z", d: "2026-04-03" },
  { id: "r175uqbk", a: "Agencia Norte GYE", at: "2026-10-17T22:56:40.941Z", d: "2026-08-19" },
  { id: "r179ck6h", a: "Agencia Sur GYE", at: "2026-10-17T22:56:40.941Z", d: null },
  { id: "r179cu8g", a: "Planta Milagro", at: "2026-10-17T22:54:36.852Z", d: "2026-09-30" },
  { id: "r17yq8h9", a: "Planta Tesalia GYE", at: "2026-10-17T22:51:48.373Z", d: "2026-06-11" },
  { id: "r186k2jf", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:10.957Z", d: null },
  { id: "r18r8tzx", a: "Planta Tesalia GYE", at: "2026-10-17T22:51:56.557Z", d: "2026-07-27" },
  { id: "r19gwbva", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:36.316Z", d: "2026-06-17" },
  { id: "r1a7cxqe", a: "Planta Tesalia GYE", at: "2026-10-17T22:48:51.365Z", d: null },
  { id: "r1b23ugo", a: "Agencia Manta", at: "2026-10-17T22:53:30.309Z", d: "2026-09-05" },
  { id: "r1b5xjt1", a: "Planta Milagro", at: "2026-10-17T22:51:56.557Z", d: "2026-08-03" },
  { id: "r1bhi6g9", a: "Planta Milagro", at: "2026-10-17T22:48:51.365Z", d: null },
  { id: "r1bs3on6", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:48.117Z", d: "2026-03-23" },
  { id: "r1bto4l8", a: "Agencia Norte GYE", at: "2026-10-17T22:57:06.885Z", d: "2026-05-23" },
  { id: "r1chwhdu", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:13.309Z", d: "2026-04-17" },
  { id: "r1ctgzxn", a: "Agencia Salinas", at: "2026-10-18T00:00:00Z", d: "2026-01-06" },
  { id: "r1dh891a", a: "Agencia Loja", at: "2026-10-17T22:57:26.100Z", d: "2026-04-28" },
  { id: "r1dlu0vo", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:26.100Z", d: "2026-02-19" },
  { id: "r1dvl0qy", a: "Agencia Norte GYE", at: "2026-10-17T22:56:58.989Z", d: null },
  { id: "r1fo7c5a", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:46.653Z", d: "2026-06-22" },
  { id: "r1fpi3sg", a: "Agencia Atacames", at: "2026-10-17T22:57:14.317Z", d: "2026-05-07" },
  { id: "r1fqcduj", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:32.637Z", d: "2026-08-24" },
  { id: "r1ftalei", a: "Planta Tesalia GYE", at: "2026-10-17T22:51:23.908Z", d: null },
  { id: "r1futvf5", a: "Agencia Ambato", at: "2026-10-17T22:59:41.853Z", d: "2025-12-19" },
  { id: "r1fzfmvm", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:59.213Z", d: "2026-09-09" },
  { id: "r1g36nwx", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:27.261Z", d: "2026-08-21" },
  { id: "r1had2zm", a: "Agencia Ambato", at: "2026-10-17T22:59:01.413Z", d: "2026-03-04" },
  { id: "r1hb5fpo", a: "Agencia Cuenca", at: "2026-10-17T22:59:14.229Z", d: "2026-02-13" },
  { id: "r1hbxdeb", a: "Agencia Sur GYE", at: "2026-10-17T22:58:02.661Z", d: "2025-03-26" },
  { id: "r1i2wk2e", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:40.941Z", d: "2026-07-20" },
  { id: "r1jb03yh", a: "Planta Tesalia GYE", at: "2026-10-17T22:49:06.213Z", d: "2026-01-28" },
  { id: "r1jdo5sz", a: "Agencia Sur GYE", at: "2026-10-17T22:50:27.916Z", d: null },
  { id: "r1jm4k2e", a: "Planta Tesalia GYE", at: "2026-10-17T22:49:06.213Z", d: "2026-02-07" },
  { id: "r1jmldf3", a: "Planta Tesalia GYE", at: "2026-10-17T22:59:01.413Z", d: "2026-03-05" },
  { id: "r1jmymal", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:49.829Z", d: "2026-06-15" },
  { id: "r1ke4tod", a: "Agencia Norte GYE", at: "2026-10-17T22:58:41.029Z", d: "2026-03-21" },
  { id: "r1l40p85", a: "Planta Tesalia GYE", at: "2026-10-17T22:49:44.117Z", d: "2026-03-14" },
  { id: "r1lajadq", a: "Agencia Norte GYE", at: "2026-10-17T22:50:02.829Z", d: "2026-04-08" },
  { id: "r1ly2a05", a: "Agencia Norte GYE", at: "2026-10-17T22:57:37.477Z", d: "2026-04-23" },
  { id: "r1mhjbro", a: "Agencia Santo Domingo", at: "2026-10-17T22:58:02.661Z", d: "2026-04-03" },
  { id: "r1mwcac5", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:26.100Z", d: "2026-04-27" },
  { id: "r1n2s7jl", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:00.253Z", d: "2026-08-30" },
  { id: "r1n96898", a: "Agencia Sur GYE", at: "2026-10-17T22:57:37.477Z", d: "2026-04-20" },
  { id: "r1nuon4t", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:02.829Z", d: "2026-04-13" },
  { id: "r1ot1vpo", a: "Planta Tesalia GYE", at: "2026-10-17T22:53:30.309Z", d: "2026-09-03" },
  { id: "r1qrzpgt", a: "Agencia Loja", at: "2026-10-17T22:54:28.685Z", d: "2026-09-23" },
  { id: "r1qwzeth", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:07.509Z", d: null },
  { id: "r1r1p0rl", a: "Agencia Norte GYE", at: "2026-10-17T22:58:41.029Z", d: "2026-03-25" },
  { id: "r1rf2qtv", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:59.213Z", d: "2026-09-28" },
  { id: "r1rwezju", a: "Agencia Salinas", at: "2026-10-17T22:48:51.365Z", d: null },
  { id: "r1te88zq", a: "Agencia Norte GYE", at: "2026-10-17T22:52:27.285Z", d: "2026-08-07" },
  { id: "r1tscn70", a: "Agencia Salinas", at: "2026-10-17T22:50:36.316Z", d: null },
  { id: "r1vmyfvn", a: "Agencia Norte GYE", at: "2026-10-17T22:56:32.637Z", d: "2026-08-19" },
  { id: "r1w1ad75", a: "Agencia Norte GYE", at: "2026-10-17T22:57:48.117Z", d: null },
  { id: "r1xpirik", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:10.957Z", d: null },
  { id: "r1xsfjuo", a: "Planta Milagro", at: "2026-10-17T22:53:10.677Z", d: "2026-08-25" },
  { id: "r1y5ce2h", a: "Planta Tesalia GYE", at: "2026-10-17T22:55:58.589Z", d: "2026-09-09" },
  { id: "r1yks82a", a: "Agencia Loja", at: "2026-10-17T22:58:41.029Z", d: null },
  { id: "r28b7cs", a: "Planta Milagro", at: "2026-10-17T22:54:28.685Z", d: null },
  { id: "r2kigpt", a: "Agencia Norte GYE", at: "2026-10-17T22:58:02.661Z", d: "2025-03-26" },
  { id: "r3d23u5", a: "Agencia Ambato", at: "2026-10-17T22:49:29.621Z", d: "2026-03-07" },
  { id: "r4t8lu6", a: "Agencia Manta", at: "2026-10-17T22:54:36.852Z", d: "2026-10-03" },
  { id: "r56ma63", a: "Agencia Norte GYE", at: "2026-10-17T22:57:37.477Z", d: "2026-04-25" },
  { id: "r5q8cu", a: "Planta Tesalia GYE", at: "2026-10-17T22:53:10.677Z", d: "2026-08-24" },
  { id: "r6oxymn", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:06.885Z", d: "2026-05-24" },
  { id: "r72ys16", a: "Agencia Ambato", at: "2026-10-17T22:57:14.317Z", d: null },
  { id: "r7n5gvc", a: "Agencia Norte GYE", at: "2026-10-17T22:58:02.661Z", d: "2026-04-01" },
  { id: "r7rnl9o", a: "Agencia Norte GYE", at: "2026-10-17T22:55:40.700Z", d: "2026-10-05" },
  { id: "r81nu24", a: "Agencia Sur GYE", at: "2026-10-17T22:59:41.853Z", d: "2026-01-14" },
  { id: "r8nh0us", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:27.916Z", d: "2026-06-15" },
  { id: "r8rmrzx", a: "Planta Tesalia GYE", at: "2026-10-17T22:59:41.853Z", d: null },
  { id: "r8ry5t", a: "Agencia Norte GYE", at: "2026-10-17T22:56:49.829Z", d: "2026-06-10" },
  { id: "r8wkzrn", a: "Planta Tesalia GYE", at: "2026-10-17T22:52:57.565Z", d: "2026-06-24" },
  { id: "r9y3c0t", a: "Agencia Norte GYE", at: "2026-10-17T22:57:48.117Z", d: "2026-04-02" },
  { id: "rabpdw", a: "Agencia Santo Domingo", at: "2026-10-17T22:56:32.637Z", d: "2026-08-19" },
  { id: "ralr7yj", a: "Planta Machachi", at: "2026-10-17T22:54:36.852Z", d: "2026-10-04" },
  { id: "rbl0mxp", a: "Planta Tesalia GYE", at: "2026-10-23T18:40:16.850Z", d: "2026-10-18" },
  { id: "rbml8m1", a: "Agencia Norte GYE", at: "2026-10-17T22:51:48.373Z", d: "2026-07-10" },
  { id: "reke2bu", a: "Agencia Norte GYE", at: "2026-10-17T22:59:14.229Z", d: "2026-02-06" },
  { id: "remrtwp", a: "Agencia Latacunga", at: "2026-10-17T22:50:18.716Z", d: "2026-06-09" },
  { id: "rerq9bt", a: "Agencia Latacunga", at: "2026-10-17T22:56:58.989Z", d: "2026-06-10" },
  { id: "rezdyz5", a: "Planta Tesalia GYE", at: "2026-10-17T22:55:18.781Z", d: "2026-10-12" },
  { id: "rf63l27", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:49.829Z", d: "2026-06-11" },
  { id: "rfah15d", a: "Agencia Manta", at: "2026-10-17T22:59:01.413Z", d: "2026-03-03" },
  { id: "rfdv2nl", a: "Planta Tesalia GYE", at: "2026-10-17T22:55:58.589Z", d: null },
  { id: "rfw8lgi", a: "Agencia Quito Norte", at: "2026-10-17T22:57:26.100Z", d: "2026-04-30" },
  { id: "rgcvs6r", a: "Planta Tesalia GYE", at: "2026-10-17T22:58:02.661Z", d: "2026-03-27" },
  { id: "rgmzs1s", a: "Agencia Norte GYE", at: "2026-11-02T10:40:04.754Z", d: "2026-10-28" },
  { id: "rgpqgo", a: "Planta Tesalia GYE", at: "2026-10-17T22:49:06.213Z", d: "2026-02-18" },
  { id: "rhl25i", a: "Planta Tesalia GYE", at: "2026-11-16T15:31:08.978Z", d: "2026-10-31" },
  { id: "ri6j4se", a: "Agencia Norte GYE", at: "2026-10-17T22:51:37.861Z", d: "2026-07-03" },
  { id: "rizs51j", a: "Agencia Sur GYE", at: "2026-10-17T22:52:48.645Z", d: "2026-08-14" },
  { id: "rj0bo7y", a: "Agencia Sur GYE", at: "2026-10-17T22:56:13.309Z", d: "2026-08-14" },
  { id: "rjvxqki", a: "Agencia Cuenca", at: "2026-10-17T22:57:14.317Z", d: "2026-03-27" },
  { id: "rjycgss", a: "Planta Tesalia GYE", at: "2026-10-17T22:58:41.029Z", d: "2025-03-19" },
  { id: "rkpnr5j", a: "Agencia Norte GYE", at: "2026-10-17T22:56:58.989Z", d: "2026-06-03" },
  { id: "rkqo858", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:10.692Z", d: "2026-04-04" },
  { id: "rky8u6", a: "Planta Tesalia GYE", at: "2026-10-17T22:52:48.645Z", d: "2026-08-18" },
  { id: "rlqkbuj", a: "Planta Milagro", at: "2026-10-17T22:50:10.692Z", d: "2025-04-15" },
  { id: "rlr9k33", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:18.716Z", d: "2026-06-05" },
  { id: "rlxuvwf", a: "Planta Tesalia GYE", at: "2026-10-17T22:52:57.565Z", d: "2026-08-19" },
  { id: "rn93wl", a: "Planta Tesalia GYE", at: "2026-10-17T22:59:14.229Z", d: "2026-01-27" },
  { id: "rnjdjnj", a: "Agencia Ibarra", at: "2026-10-17T22:50:46.653Z", d: "2026-06-28" },
  { id: "rompxcf", a: "Agencia Salinas", at: "2026-10-17T22:50:10.692Z", d: "2026-05-06" },
  { id: "rq7jme4", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:00.253Z", d: null },
  { id: "rq7w743", a: "Planta Milagro", at: "2026-10-17T22:55:18.781Z", d: "2026-10-09" },
  { id: "rqfdws7", a: "Planta Machachi", at: "2026-10-17T22:55:40.700Z", d: "2026-09-22" },
  { id: "rqgaa54", a: "Planta y Agencia Machala", at: "2026-10-17T22:51:37.861Z", d: "2026-07-07" },
  { id: "rqljly7", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:07.509Z", d: "2026-09-03" },
  { id: "rqn0r88", a: "Agencia Latacunga", at: "2026-10-17T22:56:49.829Z", d: "2026-06-11" },
  { id: "rrnnlhq", a: "Planta Tesalia GYE", at: "2026-10-17T22:54:28.685Z", d: "2026-09-23" },
  { id: "rrwp7o8", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:27.916Z", d: "2026-06-16" },
  { id: "rs0xiby", a: "Agencia Norte GYE", at: "2026-10-17T22:51:23.908Z", d: "2026-06-27" },
  { id: "rs1p2p8", a: "Agencia Latacunga", at: "2026-10-17T22:56:07.509Z", d: "2026-09-09" },
  { id: "rsejvul", a: "Agencia Salinas", at: "2026-10-17T22:52:27.285Z", d: "2026-08-14" },
  { id: "rsod3wu", a: "Planta Milagro", at: "2026-10-17T22:50:02.829Z", d: "2026-04-15" },
  { id: "rsr4zs6", a: "Planta Tesalia GYE", at: "2026-10-17T22:55:58.589Z", d: null },
  { id: "rsroaf", a: "Planta Tesalia GYE", at: "2026-10-17T22:58:02.661Z", d: "2026-03-18" },
  { id: "rssoi4y", a: "Agencia Quito Norte", at: "2026-10-17T22:59:14.229Z", d: "2026-02-13" },
  { id: "rste800", a: "Agencia Norte GYE", at: "2026-10-17T22:54:00.253Z", d: "2026-09-08" },
  { id: "rt5in06", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:46.653Z", d: null },
  { id: "rtq07bt", a: "Agencia Sur GYE", at: "2026-10-17T22:59:01.413Z", d: "2026-03-11" },
  { id: "ru913vc", a: "Agencia Norte GYE", at: "2026-10-17T22:45:11.445Z", d: null },
  { id: "ruoz2ox", a: "Planta Tesalia GYE", at: "2026-10-17T22:50:18.716Z", d: null },
  { id: "rut8u9s", a: "Planta Tesalia GYE", at: "2026-10-17T22:55:18.781Z", d: "2026-10-15" },
  { id: "rv39bep", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:06.885Z", d: "2026-05-22" },
  { id: "rvjfl9r", a: "Planta Tesalia GYE", at: "2026-10-17T22:56:13.309Z", d: "2026-06-01" },
  { id: "rvlllnx", a: "Agencia Ambato", at: "2026-10-17T22:55:18.781Z", d: "2026-10-11" },
  { id: "rvq41l7", a: "Planta Tesalia GYE", at: "2026-11-02T10:39:46.762Z", d: "2026-10-24" },
  { id: "rvw38qb", a: "Planta Tesalia GYE", at: "2026-10-17T22:53:22.541Z", d: null },
  { id: "rwl4ml9", a: "Planta Tesalia GYE", at: "2026-10-17T22:59:14.229Z", d: "2026-11-20" },
  { id: "rxdd122", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:48.117Z", d: "2026-04-06" },
  { id: "rxwzebn", a: "Agencia Quito Norte", at: "2026-10-17T22:58:02.661Z", d: "2026-03-31" },
  { id: "rxzxq88", a: "Agencia Quevedo", at: "2026-10-17T22:49:29.621Z", d: null },
  { id: "rycr0be", a: "Planta Tesalia GYE", at: "2026-10-17T22:51:37.861Z", d: "2026-07-06" },
  { id: "rywxqsc", a: "Planta Tesalia GYE", at: "2026-10-17T22:53:03.261Z", d: "2026-08-01" },
  { id: "ryxt0wq", a: "Planta Tesalia GYE", at: "2026-10-17T22:57:37.477Z", d: "2026-02-19" },
  { id: "rzl7kvk", a: "Agencia Sur GYE", at: "2026-10-17T22:56:49.829Z", d: "2026-06-29" }
];

export const INITIAL_EXTRA_INCIDENTS: IncidentRecord[] = [];

export const INITIAL_FEED: FeedState = {
  nov: {
    '2026-10-12_D': { ag: {}, at: '2026-10-17T16:56:49.229Z', d: '2026-10-12', t: 'D' },
    '2026-10-12_N': { ag: { 'Agencia Norte GYE': [1, 1, 0, 0, 0, 0, 0, 0, 0, 1], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], 'Planta Milagro': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], 'Planta Tesalia GYE': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-12', t: 'N' },
    '2026-10-13_D': { ag: { 'Agencia Norte GYE': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-13', t: 'D' },
    '2026-10-13_N': { ag: { 'Planta Milagro': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-13', t: 'N' },
    '2026-10-14_D': { ag: {}, at: '2026-10-17T16:56:49.229Z', d: '2026-10-14', t: 'D' },
    '2026-10-14_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-14', t: 'N' },
    '2026-10-15_D': { ag: { 'Agencia Ibarra': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1], 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Planta Milagro': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-15', t: 'D' },
    '2026-10-15_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Planta Tesalia GYE': [1, 0, 1, 0, 0, 0, 0, 1, 0, 0] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-15', t: 'N' },
    '2026-10-16_D': { ag: { 'Agencia Loja': [1, 1, 0, 0, 0, 0, 0, 0, 0, 1], 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-16', t: 'D' },
    '2026-10-16_N': { ag: { 'Planta Milagro': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-16', t: 'N' },
    '2026-10-17_D': { ag: { 'Agencia Salinas': [1, 1, 0, 0, 0, 0, 0, 0, 0, 1], 'Planta Tesalia GYE': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-17', t: 'D' },
    '2026-10-17_N': { ag: {}, at: '2026-10-20T05:59:10.016Z', d: '2026-10-17', t: 'N' },
    '2026-10-18_D': { ag: { 'Agencia Manta': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-18', t: 'D' },
    '2026-10-18_N': { ag: { 'Planta Tesalia GYE': [3, 0, 0, 1, 0, 2, 0, 2, 0, 1] }, at: '2026-10-20T05:59:10.016Z', d: '2026-10-18', t: 'N' },
    '2026-10-19_D': { ag: { 'Planta Tesalia GYE': [1, 0, 1, 0, 0, 0, 0, 0, 0, 1] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-19', t: 'D' },
    '2026-10-19_N': { ag: { 'Agencia Norte GYE': [1, 1, 0, 0, 0, 0, 0, 0, 0, 1] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-19', t: 'N' },
    '2026-10-20_D': { ag: {}, at: '2026-10-26T11:41:01.491Z', d: '2026-10-20', t: 'D' },
    '2026-10-20_N': { ag: { 'Planta Milagro': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-20', t: 'N' },
    '2026-10-21_D': { ag: { 'Bodega MEMX Quito': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0], 'Planta Tesalia GYE': [1, 0, 0, 0, 0, 0, 1, 1, 0, 0] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-21', t: 'D' },
    '2026-10-22_D': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Quito Sur': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-22', t: 'D' },
    '2026-10-22_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-22', t: 'N' },
    '2026-10-23_D': { ag: { 'Planta Tesalia GYE': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-23', t: 'D' },
    '2026-10-23_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Planta Milagro': [2, 0, 0, 1, 0, 0, 1, 2, 0, 0] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-23', t: 'N' },
    '2026-10-24_D': { ag: { 'Planta Tesalia GYE': [1, 1, 0, 0, 0, 0, 0, 0, 0, 1] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-24', t: 'D' },
    '2026-10-24_N': { ag: { 'Agencia Norte GYE': [1, 1, 0, 0, 0, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Planta Tesalia GYE': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-24', t: 'N' },
    '2026-10-25_D': { ag: { 'Planta Tesalia GYE': [1, 0, 0, 1, 0, 0, 0, 0, 1, 0] }, at: '2026-10-26T11:41:01.491Z', d: '2026-10-25', t: 'D' },
    '2026-10-26_D': { ag: { 'Planta Tesalia GYE': [1, 0, 0, 0, 0, 0, 1, 1, 0, 0] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-26', t: 'D' },
    '2026-10-26_N': { ag: { 'Planta Tesalia GYE': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-26', t: 'N' },
    '2026-10-27_D': { ag: { 'Planta y Agencia Machala': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-27', t: 'D' },
    '2026-10-27_N': { ag: { 'Agencia Manta': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-27', t: 'N' },
    '2026-10-28_N': { ag: { 'Agencia Salinas': [1, 1, 0, 0, 0, 0, 0, 1, 0, 0] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-28', t: 'N' },
    '2026-10-29_D': { ag: { 'Agencia Norte GYE': [1, 0, 1, 0, 0, 0, 0, 0, 0, 1], 'Planta Tesalia GYE': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-29', t: 'D' },
    '2026-10-29_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-29', t: 'N' },
    '2026-10-30_D': { ag: { 'Planta Tesalia GYE': [1, 0, 1, 0, 0, 0, 0, 0, 0, 1] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-30', t: 'D' },
    '2026-10-30_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-30', t: 'N' },
    '2026-10-31_N': { ag: { 'Agencia Norte GYE': [1, 0, 1, 0, 0, 0, 0, 0, 0, 1] }, at: '2026-11-02T10:42:04.563Z', d: '2026-10-31', t: 'N' },
    '2026-11-01_N': { ag: {}, at: '2026-11-02T10:42:04.563Z', d: '2026-11-01', t: 'N' },
    '2026-11-02_D': { ag: { 'Agencia Quevedo': [1, 0, 0, 1, 0, 0, 0, 0, 1, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 0, 1, 0, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-02', t: 'D' },
    '2026-11-02_N': { ag: { 'Agencia Norte GYE': [1, 1, 0, 0, 0, 0, 0, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-02', t: 'N' },
    '2026-11-03_D': { ag: { 'Agencia Sur GYE': [1, 0, 0, 0, 0, 0, 1, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-03', t: 'D' },
    '2026-11-03_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [2, 0, 0, 0, 2, 0, 0, 2, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-03', t: 'N' },
    '2026-11-04_D': { ag: { 'Bodega MEMX Quito': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-04', t: 'D' },
    '2026-11-04_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Salinas': [1, 0, 1, 0, 0, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Bodega MEMX Quito': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-04', t: 'N' },
    '2026-11-05_D': { ag: {}, at: '2026-11-10T18:41:26.843Z', d: '2026-11-05', t: 'D' },
    '2026-11-05_N': { ag: { 'Agencia Norte GYE': [2, 0, 0, 0, 2, 0, 0, 2, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-05', t: 'N' },
    '2026-11-06_D': { ag: {}, at: '2026-11-10T18:41:26.843Z', d: '2026-11-06', t: 'D' },
    '2026-11-06_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-06', t: 'N' },
    '2026-11-07_D': { ag: {}, at: '2026-11-10T18:41:26.843Z', d: '2026-11-07', t: 'D' },
    '2026-11-07_N': { ag: {}, at: '2026-11-10T18:41:26.843Z', d: '2026-11-07', t: 'N' },
    '2026-11-08_D': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 0, 1, 0, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-08', t: 'D' },
    '2026-11-08_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-10T18:41:26.843Z', d: '2026-11-08', t: 'N' },
    '2026-11-09_D': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 0, 0, 1, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-09', t: 'D' },
    '2026-11-09_N': { ag: { 'Agencia Norte GYE': [1, 1, 0, 0, 0, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-09', t: 'N' },
    '2026-11-10_D': { ag: { 'Agencia Atacames': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-10', t: 'D' },
    '2026-11-10_N': { ag: { 'Agencia Latacunga': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1], 'Agencia Manta': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0], 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Santo Domingo': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0], 'Agencia Sur GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Planta Tesalia GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-10', t: 'N' },
    '2026-11-11_D': { ag: {}, at: '2026-11-16T15:26:17.610Z', d: '2026-11-11', t: 'D' },
    '2026-11-11_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0], 'Agencia Quevedo': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0], 'Planta Tesalia GYE': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-11', t: 'N' },
    '2026-11-12_D': { ag: {}, at: '2026-11-16T15:26:17.610Z', d: '2026-11-12', t: 'D' },
    '2026-11-12_N': { ag: {}, at: '2026-11-16T15:26:17.610Z', d: '2026-11-12', t: 'N' },
    '2026-11-13_D': { ag: { 'Agencia Santo Domingo': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1], 'Agencia Sur GYE': [1, 0, 0, 1, 0, 0, 0, 0, 0, 1] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-13', t: 'D' },
    '2026-11-13_N': { ag: { 'Agencia Norte GYE': [1, 0, 0, 0, 0, 0, 1, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-13', t: 'N' },
    '2026-11-14_D': { ag: { 'Agencia Norte GYE': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-14', t: 'D' },
    '2026-11-14_N': { ag: { 'Planta Tesalia GYE': [1, 0, 0, 0, 0, 0, 1, 0, 0, 1] }, at: '2026-11-16T15:26:17.610Z', d: '2026-11-14', t: 'N' },
    '2026-11-15_D': { ag: {}, at: '2026-11-16T15:26:17.610Z', d: '2026-11-15', t: 'D' },
    '2026-11-15_N': { ag: {}, at: '2026-11-16T15:26:17.610Z', d: '2026-11-15', t: 'N' }
  },
  bl: {
    ag: {
      'Agencia Ambato': [200, 74],
      'Agencia Atacames': [207, 67],
      'Agencia Cuenca': [130, 144],
      'Agencia Ibarra': [68, 206],
      'Agencia Latacunga': [61, 213],
      'Agencia Loja': [45, 229],
      'Agencia Manta': [263, 12],
      'Agencia Norte GYE': [226, 48],
      'Agencia Puyo': [33, 242],
      'Agencia Quevedo': [85, 189],
      'Agencia Quito Norte': [218, 56],
      'Agencia Quito Sur': [216, 58],
      'Agencia Salinas': [82, 193],
      'Agencia Santo Domingo': [184, 90],
      'Agencia Sur GYE': [224, 50],
      'Planta y Agencia Machala': [88, 186]
    },
    at: '2026-11-16T15:26:51.674Z',
    nat: MONTHLY_TRENDS.bl
  },
  sp: {
    ag: {
      'Agencia Ambato': [98, 540],
      'Agencia Atacames': [64, 574],
      'Agencia Cuenca': [98, 540],
      'Agencia Ibarra': [74, 564],
      'Agencia Latacunga': [84, 554],
      'Agencia Loja': [239, 399],
      'Agencia Manta': [217, 421],
      'Agencia Norte GYE': [629, 9],
      'Agencia Puyo': [5, 633],
      'Agencia Quevedo': [145, 493],
      'Agencia Quito Norte': [510, 128],
      'Agencia Quito Sur': [487, 151],
      'Agencia Salinas': [58, 580],
      'Agencia Santo Domingo': [96, 542],
      'Agencia Sur GYE': [596, 42],
      'Bodega MEMX Quito': [489, 149],
      'Edificio WorQ': [187, 451],
      'Planta Machachi': [319, 319],
      'Planta Milagro': [241, 397],
      'Planta Tesalia GYE': [633, 5],
      'Planta y Agencia Machala': [134, 504]
    },
    at: '2026-11-16T15:26:55.378Z',
    nat: MONTHLY_TRENDS.sp
  },
  dc: {
    ag: {
      'Agencia Ambato': 156,
      'Agencia Atacames': 324,
      'Agencia Cuenca': 0,
      'Agencia Ibarra': 4,
      'Agencia Latacunga': 35,
      'Agencia Loja': 1,
      'Agencia Manta': 765,
      'Agencia Norte GYE': 798,
      'Agencia Quevedo': 20,
      'Agencia Quito Norte': 0,
      'Agencia Quito Sur': 0,
      'Agencia Salinas': 153,
      'Agencia Santo Domingo': 263,
      'Agencia Sur GYE': 6,
      'Planta Machachi': 0,
      'Planta Milagro': 0,
      'Planta Tesalia GYE': 0,
      'Planta y Agencia Machala': 825
    },
    at: '2026-11-16T15:24:09.810Z',
    nat: MONTHLY_TRENDS.dc
  },
  bq: {
    ...BLOCKED_PERSONNEL,
    at: '2026-11-16T15:27:06.234Z'
  },
  cam: {
    at: '2026-11-16T15:23:48.443Z',
    date: '2026-11-16',
    no: 2,
    op: 617,
    t: 'D',
    sites: CAMERAS_INITIAL.sites
  },
  camm: {
    at: '2026-11-16T15:23:48.443Z',
    months: {
      OCT: { cams: 618, n: 50, no: 3.4, pct: 99.45 },
      NOV: { cams: 619, n: 31, no: 6.39, pct: 98.97 }
    }
  },
  vl: {
    ...VALIDATIONS,
    at: '2026-11-16T15:26:37.330Z'
  },
  rev: AUDIT_REPORTS_DATA.reduce((acc, item) => {
    acc[item.id] = { a: item.a, d: item.d, at: item.at || '2026-10-17T22:50:00Z' };
    return acc;
  }, {} as FeedState['rev'])
};

// SVG Geometries for Ecuador, Colombia, and Peru borders
export const MAP_PATHS = {
  ec: "M631,171 626,174 612,176 597,172 597,176 611,185 617,201 634,215 634,219 632,231 635,255 633,257 625,257 619,252 603,313 551,373 492,416 374,458 366,465 342,495 341,498 344,506 337,509 332,500 325,500 320,519 318,538 313,544 309,555 305,559 300,576 292,593 292,598 295,606 291,616 274,627 269,631 267,637 268,646 262,647 257,657 252,659 241,656 233,656 227,653 215,637 210,627 208,614 196,606 180,608 146,590 140,591 131,602 122,606 118,606 112,603 111,599 125,581 114,581 111,577 109,567 111,561 116,558 130,560 133,555 141,551 142,548 137,534 138,521 136,518 133,502 127,499 144,492 157,483 164,476 168,469 178,438 187,418 185,409 178,396 176,367 171,375 172,402 167,415 161,418 157,416 159,395 155,399 147,413 135,423 135,426 131,431 115,423 91,400 76,395 67,387 64,379 83,368 84,354 84,342 77,323 80,298 78,289 70,268 76,258 98,250 105,245 109,228 114,219 124,222 132,222 122,218 113,204 112,197 128,177 136,171 146,161 155,144 158,119 151,81 157,77 170,74 180,68 186,62 199,63 213,54 237,50 270,39 277,30 274,14 286,24 292,32 309,40 329,55 342,63 356,70 377,77 390,76 395,88 413,96 418,118 420,121 431,124 449,125 460,130 477,135 483,136 486,135 487,133 500,136 510,137 517,134 519,122 521,119 529,115 533,116 553,125 572,145 582,151 598,154 613,164 631,171ZM147,457 145,461 133,460 135,441 137,435 152,427 160,427 169,432 159,442 151,445 147,457ZM269,35 264,35 261,31 270,24 269,35Z",
  co: "M1028,-1026 964,-1007 935,-960 915,-951 891,-924 873,-889 859,-819 823,-759 854,-766 864,-754 880,-751 894,-703 918,-678 924,-655 915,-637 913,-592 921,-582 939,-577 959,-543 1047,-539 1086,-549 1147,-535 1217,-452 1233,-450 1266,-460 1313,-456 1374,-469 1412,-458 1413,-433 1403,-423 1396,-396 1377,-367 1374,-291 1394,-226 1429,-182 1377,-129 1374,-119 1398,-119 1439,-79 1447,-40 1472,24 1472,38 1452,42 1451,-2 1420,-52 1404,-47 1378,-19 1367,-15 1341,-39 1335,-25 1342,-12 1228,-12 1206,-17 1175,-11 1175,54 1229,55 1244,74 1245,96 1232,97 1213,87 1155,102 1153,174 1168,192 1197,211 1199,236 1215,260 1220,280 1164,584 1126,542 1107,547 1086,538 1153,435 1151,426 1063,381 1020,393 985,375 962,393 938,400 921,403 897,395 866,399 845,388 847,368 840,343 810,329 808,305 793,285 735,257 718,218 680,180 666,179 646,165 631,171 582,151 553,125 533,116 521,119 517,134 510,137 477,135 420,121 413,96 395,88 390,76 377,77 329,55 292,32 257,-2 264,-15 281,-25 302,-17 305,-32 297,-46 301,-76 318,-88 354,-91 373,-113 379,-112 393,-128 391,-144 404,-148 418,-174 424,-175 452,-231 444,-226 434,-229 432,-246 424,-234 417,-246 419,-265 408,-261 425,-280 431,-312 423,-372 406,-394 435,-418 413,-458 413,-468 420,-467 423,-497 416,-509 408,-509 370,-563 386,-594 384,-610 401,-594 406,-597 425,-611 426,-624 440,-637 412,-690 421,-704 475,-649 468,-637 481,-633 486,-640 483,-671 468,-697 532,-739 557,-777 596,-785 600,-794 592,-813 606,-860 589,-854 605,-873 615,-901 676,-951 727,-940 711,-933 708,-926 720,-917 746,-972 829,-970 888,-1011 932,-1029 946,-1059 989,-1082 1011,-1083 1034,-1073 1046,-1045 1028,-1026ZM348,-94 341,-96 342,-105 348,-94Z",
  pe: "M1164,584 1155,593 1136,590 1120,575 1080,577 1063,595 976,610 925,639 890,667 871,672 862,723 836,770 846,807 784,851 779,868 788,891 764,898 760,916 788,938 782,954 796,967 805,995 824,1008 830,1025 863,1059 863,1072 839,1101 879,1101 922,1111 943,1144 942,1160 1036,1157 1106,1104 1101,1114 1103,1131 1096,1142 1096,1261 1107,1255 1121,1266 1131,1266 1164,1253 1202,1255 1291,1410 1284,1429 1262,1448 1262,1510 1252,1528 1273,1577 1260,1587 1259,1598 1224,1640 1223,1656 1243,1684 1218,1724 1238,1775 1276,1794 1257,1808 1258,1824 1240,1837 1216,1869 1197,1880 1209,1911 1175,1930 1180,1959 1167,1981 1142,1992 1118,1995 1026,1928 1020,1902 1007,1890 949,1860 913,1831 787,1780 745,1751 649,1701 607,1650 567,1623 543,1583 531,1573 530,1555 522,1546 534,1540 542,1512 537,1497 510,1458 477,1395 445,1366 438,1326 397,1289 386,1244 341,1169 284,1022 259,981 222,944 198,890 161,837 149,825 46,766 44,748 51,741 67,744 72,723 43,677 49,663 26,627 37,583 80,533 127,499 133,502 142,548 130,560 111,561 111,577 125,581 112,603 122,606 146,590 180,608 196,606 208,614 210,627 227,653 257,657 268,646 269,631 291,616 292,593 318,538 325,500 337,509 344,506 342,495 374,458 492,416 551,373 603,313 619,252 635,255 634,219 597,172 626,174 638,164 680,180 684,190 698,197 718,218 735,257 793,285 808,305 810,329 840,343 847,368 845,388 866,399 897,395 921,403 938,400 962,393 985,375 1020,393 1063,381 1151,426 1153,435 1086,538 1107,547 1126,542 1164,584Z"
};

export const METHODOLOGY_DEFINITIONS = [
  {
    indicator: 'Novedades e Incidencias',
    formula: 'Suma agregada de novedades de las 21 sedes operativas + cargas de turnos Excel + registros manuales',
    criteria: 'Reportes semanales de novedades del CCO (Excel), más bitácora manual y cargas posteriores. Cada fila con detalle cuenta una novedad.',
    period: 'Enero – Noviembre 2026'
  },
  {
    indicator: 'Cámaras CCTV Operativas',
    formula: 'Operativas ÷ Total Cámaras Instaladas (Operativas + Sin operar)',
    criteria: 'Control de cámaras del último turno diurno/nocturno registrado en las 21 localidades monitoreadas.',
    period: 'Corte 16/11/2026 (Turno Día)'
  },
  {
    indicator: 'Supervisión de Turnos',
    formula: 'Turnos con supervisión efectiva ÷ Turnos totales registrados (SI ÷ [SI + NO])',
    criteria: 'Control de supervisión: 2 turnos por día y sede (día y noche). Promedio semanal por sede = porcentaje × 14 turnos.',
    period: 'Enero – Noviembre 2026'
  },
  {
    indicator: 'Ingreso de Blindados',
    formula: 'Días con ingreso efectivo ÷ Días operativos evaluados (Lunes a Sábado)',
    criteria: 'Frecuencia de blindados: hora registrada = ingreso; NO INGRESA = sin ingreso. Promedio semanal = porcentaje × 6 días.',
    period: 'Enero – Noviembre 2026'
  },
  {
    indicator: 'Decomisos Incautados',
    formula: 'Suma consolidada de unidades de producto incautadas por sede',
    criteria: 'Control de decomisos (hojas mensuales y registros por sede). Se suman las unidades incautadas cada día.',
    period: 'Enero – Noviembre 2026'
  },
  {
    indicator: 'Personal Bloqueado',
    formula: 'Conteo de bloqueados activos y desbloqueados regularizados',
    criteria: 'Hojas BLOQUEADOS y DESBLOQUEADOS. Por privacidad solo se consolidan motivos, empresas y años, sin nombres ni cédulas.',
    period: '2024 – 2026'
  },
  {
    indicator: 'Validaciones de Seguridad',
    formula: 'Total personas validadas = En sedes + Varias localidades + Sin sede específica',
    criteria: 'Verificación de antecedentes a proveedores, contratistas, transportistas y visitas técnicas.',
    period: '2025 – 2026'
  },
  {
    indicator: 'Auditorías de Video (CCTV)',
    formula: 'Conteo de informes únicos de revisión de cámaras',
    criteria: 'Informes Word (.docx) o registros de revisión técnica de video. Archivos duplicados se consolidan por código único.',
    period: '2025 – 2026'
  }
];
