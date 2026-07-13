import { buildDashboardData, getState } from "./store";
import type { AppState, DashboardData } from "./types";

type SheetRow = Record<string, unknown>;
type WorkbookSheet = { name: string; rows: SheetRow[] };

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeCell(value: unknown) {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toRows<T extends object>(rows: T[]): SheetRow[] {
  return rows.map((row) => ({ ...row }) as SheetRow);
}

function columnName(index: number) {
  let value = index + 1;
  let name = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function sheetXml(rows: SheetRow[]) {
  const safeRows = rows.length ? rows : [{ estado: "Sin datos" }];
  const headers = Object.keys(safeRows[0]);
  const allRows = [headers, ...safeRows.map((row) => headers.map((header) => normalizeCell(row[header])))];

  const xmlRows = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${xmlRows}</sheetData>
</worksheet>`;
}

function contentTypesXml(sheetCount: number) {
  const sheetOverrides = Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
</Types>`;
}

function packageRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml(sheets: WorkbookSheet[]) {
  const sheetNodes = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetNodes}</sheets>
</workbook>`;
}

function workbookRelsXml(sheetCount: number) {
  const relationships = Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relationships}
</Relationships>`;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime() {
  const date = new Date();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function zip(files: { path: string; data: Buffer }[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  const { dosTime, dosDate } = dosDateTime();
  let offset = 0;

  files.forEach((file) => {
    const name = Buffer.from(file.path, "utf8");
    const checksum = crc32(file.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(file.data.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, file.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(file.data.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + file.data.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const localFiles = Buffer.concat(localParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localFiles.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localFiles, centralDirectory, end]);
}

function workbookFiles(sheets: WorkbookSheet[]) {
  return [
    { path: "[Content_Types].xml", data: Buffer.from(contentTypesXml(sheets.length)) },
    { path: "_rels/.rels", data: Buffer.from(packageRelsXml()) },
    { path: "xl/workbook.xml", data: Buffer.from(workbookXml(sheets)) },
    { path: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRelsXml(sheets.length)) },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      data: Buffer.from(sheetXml(sheet.rows)),
    })),
  ];
}

export function buildExcelBuffer(state: AppState = getState()): Buffer {
  const dashboard = buildDashboardData(state);
  const sheets: WorkbookSheet[] = [
    {
      name: "Inicio",
      rows: [
        {
          titulo: dashboard.title,
          fase_actual: dashboard.current_phase?.name ?? "Sin fase",
          ultima_actualizacion: dashboard.last_updated,
          participantes: state.participants.length,
          partidos: state.matches.length,
        },
      ],
    },
    {
      name: "Participantes",
      rows: state.participants.map((participant) => ({
        id: participant.id,
        nombre: participant.name,
        codigo: participant.code,
        activo: participant.active,
        rol: participant.role,
      })),
    },
    { name: "Fases", rows: toRows(state.phases) },
    { name: "Partidos", rows: toRows(state.matches) },
    {
      name: "Predicciones",
      rows: state.predictions.map((prediction) => ({
        id: prediction.id,
        submission_id: prediction.submission_id,
        participante: state.participants.find((item) => item.id === prediction.participant_id)?.name,
        fase_id: prediction.phase_id,
        partido_id: prediction.match_id,
        equipo_a: prediction.team_a,
        equipo_b: prediction.team_b,
        goles_a_90: prediction.goals_a_90,
        goles_b_90: prediction.goals_b_90,
        clasificado: prediction.predicted_qualifier,
        via: prediction.predicted_method,
        valida: prediction.is_valid,
      })),
    },
    { name: "Resultados", rows: toRows(state.results) },
    {
      name: "Calculo_Puntos",
      rows: dashboard.participantViews.flatMap((participant) =>
        participant.matches.map((match) => ({
          participante: participant.participant_name,
          partido: `${match.team_a} vs ${match.team_b}`,
          prediccion: match.prediction_label,
          clasificado: match.qualifier_label,
          via: match.method_label,
          resultado: match.result_label,
          puntos: match.points,
        })),
      ),
    },
    { name: "Posiciones", rows: toRows(dashboard.standings) },
    {
      name: "Metricas",
      rows: [
        {
          metrica: "Partido con mas puntos repartidos",
          valor: dashboard.metrics.match_most_points
            ? `${dashboard.metrics.match_most_points.team_a} vs ${dashboard.metrics.match_most_points.team_b}`
            : "N/D",
          puntos: dashboard.metrics.match_most_points?.points_distributed ?? 0,
        },
        {
          metrica: "Lider actual",
          valor: dashboard.metrics.biggest_riser?.participant_name ?? "N/D",
          puntos: dashboard.metrics.biggest_riser?.points ?? 0,
        },
        {
          metrica: "Predicciones por 90 minutos",
          valor: dashboard.metrics.method_distribution["90 minutos"],
        },
        {
          metrica: "Predicciones por suplementario",
          valor: dashboard.metrics.method_distribution.Suplementario,
        },
        {
          metrica: "Predicciones por penales",
          valor: dashboard.metrics.method_distribution.Penales,
        },
      ],
    },
  ];

  return zip(workbookFiles(sheets));
}

export function buildDashboardExcelBuffer(dashboard: DashboardData): Buffer {
  const sheets: WorkbookSheet[] = [
    {
      name: "Resumen",
      rows: [
        {
          titulo: dashboard.title,
          fase_actual: dashboard.current_phase?.name ?? "Sin fase",
          estado: dashboard.current_phase?.status ?? "Sin estado",
          ultima_actualizacion: dashboard.last_updated,
          lider: dashboard.metrics.biggest_riser?.participant_name ?? "N/D",
          puntos_lider: dashboard.metrics.biggest_riser?.points ?? 0,
        },
      ],
    },
    { name: "Posiciones", rows: toRows(dashboard.standings) },
    { name: "Partidos", rows: toRows(dashboard.matchInsights) },
    {
      name: "Detalle_Participantes",
      rows: dashboard.participantViews.flatMap((participant) =>
        participant.matches.map((match) => ({
          participante: participant.participant_name,
          partido_id: match.match_id,
          partido: `${match.team_a} vs ${match.team_b}`,
          apuesta: match.prediction_label,
          clasificado_apostado: match.qualifier_label,
          via_apostada: match.method_label,
          resultado: match.result_label,
          puntos: match.points,
          estado: match.status,
        })),
      ),
    },
    {
      name: "Antecedente_Octavos",
      rows:
        dashboard.previousMatches?.map((match) => ({
          partido_id: match.match_id,
          resultado: match.label,
          clasificado: match.qualifier,
          via: match.method,
        })) ?? [],
    },
    {
      name: "Semifinales",
      rows:
        dashboard.nextMatches?.map((match) => ({
          partido_id: match.match_id,
          fase: match.phase,
          fecha_hora_peru: match.starts_at,
          equipo_a: match.team_a,
          equipo_b: match.team_b,
          fuente: match.source,
          estado: match.status,
        })) ?? [],
    },
    {
      name: "Metricas",
      rows: [
        {
          metrica: "Lider actual",
          valor: dashboard.metrics.biggest_riser?.participant_name ?? "N/D",
          puntos: dashboard.metrics.biggest_riser?.points ?? 0,
        },
        {
          metrica: "Partido con mas puntos repartidos",
          valor: dashboard.metrics.match_most_points
            ? `${dashboard.metrics.match_most_points.team_a} vs ${dashboard.metrics.match_most_points.team_b}`
            : "N/D",
          puntos: dashboard.metrics.match_most_points?.points_distributed ?? 0,
        },
        {
          metrica: "Predicciones por 90 minutos",
          valor: dashboard.metrics.method_distribution["90 minutos"],
        },
        {
          metrica: "Predicciones por suplementario",
          valor: dashboard.metrics.method_distribution.Suplementario,
        },
        {
          metrica: "Predicciones por penales",
          valor: dashboard.metrics.method_distribution.Penales,
        },
      ],
    },
  ];

  return zip(workbookFiles(sheets));
}
