import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type EmpresaType = 'Vitralab' | 'Nativalab' | 'Onixlab';

export interface ProcessedCsvRow {
  id: string;
  uniqueKey: string;
  empresa: EmpresaType;
  mesId: string;
  emissao: string;
  vProd: number;
  cidade: string;
  uf: string;
  regiao: string;
}

// Alias para manter compatibilidade com o hook useCsvMemory existente
export type ProcessedRow = ProcessedCsvRow;

const ufToRegiao: Record<string, string> = {
  'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
  'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
  'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
  'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
};

export const parseBrazilianCurrency = (value: string | number): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim().replace(/R\$/gi, '').replace(/\s/g, '');
  if (!raw) return 0;

  let normalized = raw;
  if (raw.includes('.') && raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',')) {
    normalized = raw.replace(',', '.');
  }

  normalized = normalized.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export const extractMonthId = (emissao: string | Date): string | null => {
  if (!emissao) return null;

  if (emissao instanceof Date && !isNaN(emissao.getTime())) {
    return `${emissao.getFullYear()}-${String(emissao.getMonth() + 1).padStart(2, '0')}`;
  }

  const emissaoStr = String(emissao).trim();
  if (!emissaoStr) return null;

  const normalizeYear = (year: number): number => {
    if (year < 100) {
      return year >= 70 ? 1900 + year : 2000 + year;
    }
    return year;
  };

  const monthIdFromParts = (year: number, month: number): string | null => {
    if (month < 1 || month > 12) return null;
    const normalizedYear = normalizeYear(year);
    return `${normalizedYear}-${String(month).padStart(2, '0')}`;
  };

  const isoMatch = emissaoStr.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`;
  }

  const brMatch = emissaoStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})/);
  if (brMatch) {
    const first = Number(brMatch[1]);
    const second = Number(brMatch[2]);
    const year = Number(brMatch[3]);

    // Exportacoes antigas de Excel podem chegar como M/D/YY.
    // Se o primeiro numero for <= 12, preferimos interpretar como mes.
    if (first >= 1 && first <= 12) {
      return monthIdFromParts(year, first);
    }

    return monthIdFromParts(year, second);
  }

  const parts = String(emissao).trim().split(' ');
  if (!parts[0]) return null;
  
  const dateParts = parts[0].split('/');
  if (dateParts.length >= 3) {
    const first = Number(dateParts[0]);
    const second = Number(dateParts[1]);
    const year = Number(dateParts[2]);

    if (Number.isNaN(first) || Number.isNaN(second) || Number.isNaN(year)) {
      return null;
    }

    if (first >= 1 && first <= 12) {
      return monthIdFromParts(year, first);
    }

    return monthIdFromParts(year, second);
  }
  return null;
};

export const splitCityAndUF = (cidadeUf: string): { cidade: string; uf: string; regiao: string } => {
  if (!cidadeUf) return { cidade: 'Desconhecida', uf: '', regiao: 'Outros' };
  
  const parts = String(cidadeUf).split('-');
  let uf = '';
  let cidade = String(cidadeUf).trim();

  if (parts.length > 1) {
    uf = parts.pop()?.trim() || '';
    cidade = parts.join('-').trim();
  }

  const regiao = ufToRegiao[uf.toUpperCase()] || 'Outros';

  return { cidade, uf, regiao };
};

const normalizeHeader = (header: string): string => {
  return String(header)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

const getFieldValue = (row: Record<string, any>, aliases: string[]): any => {
  const normalizedAliases = aliases.map((a) => normalizeHeader(a));
  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeHeader(key))) {
      return value;
    }
  }
  return '';
};

const processInvoiceRows = (rows: any[], empresa: EmpresaType): { data: ProcessedCsvRow[]; errors: string[]; monthId: string } => {
  const processed: ProcessedCsvRow[] = [];
  const errors: string[] = [];
  let mainMonthId: string | null = null;

  rows.forEach((row, index) => {
    const idCol = getFieldValue(row, ['Id.', 'id.', 'ID.', 'Id', 'id']);
    if (String(idCol || '').trim().toLowerCase() === 'totais') {
      return;
    }

    const emissao = getFieldValue(row, ['Emissão', 'Emissao', 'Data Emissão', 'Data Emissao']);
    const vProdRaw = getFieldValue(row, ['V.Prod.', 'V Prod', 'Valor Produto', 'VProd']);

    if (!emissao || (vProdRaw === '' || vProdRaw === null || vProdRaw === undefined)) {
      return;
    }

    const vProd = parseBrazilianCurrency(vProdRaw);
    if (vProd <= 0) {
      return;
    }

    const monthId = extractMonthId(emissao);
    if (!monthId) {
      return;
    }

    if (!mainMonthId) {
      mainMonthId = monthId;
    } else if (mainMonthId !== monthId) {
      errors.push(`Linha ${index + 2}: Mês diferente detectado (${monthId}). Esperado: ${mainMonthId}. Linha ignorada.`);
      return;
    }

    const cidadeUf = getFieldValue(row, ['Cidade', 'Cidade-UF', 'Cidade/UF', 'Município', 'Municipio']);
    const { cidade, uf, regiao } = splitCityAndUF(String(cidadeUf || ''));

    const numNf = getFieldValue(row, ['Núm/NF-e', 'Num/NF-e', 'NF-e', 'NFe', 'Numero NF', 'Numero NFe']) || String(index);
    const uniqueKey = `${empresa}-${monthId}-${numNf}-${vProd}`;

    processed.push({
      id: uniqueKey,
      uniqueKey,
      empresa,
      mesId: monthId,
      emissao: String(emissao),
      vProd,
      cidade,
      uf,
      regiao
    });
  });

  if (!mainMonthId) {
    throw new Error('Nenhum dado válido encontrado no arquivo.');
  }

  return { data: processed, errors, monthId: mainMonthId };
};

const parseXlsxRows = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          reject(new Error('Falha ao ler o arquivo XLSX.'));
          return;
        }

        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Nenhuma aba encontrada no arquivo XLSX.'));
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
          dateNF: 'dd/mm/yyyy'
        });

        resolve(rows as any[]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao carregar o arquivo XLSX.'));
    reader.readAsArrayBuffer(file);
  });
};

export const processInvoiceCsv = (file: File, empresa: EmpresaType): Promise<{ data: ProcessedCsvRow[], errors: string[], monthId: string }> => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      parseXlsxRows(file)
        .then((rows) => {
          try {
            resolve(processInvoiceRows(rows, empresa));
          } catch (err: any) {
            reject(err);
          }
        })
        .catch((err: any) => {
          reject(new Error(`Erro ao ler o arquivo XLSX: ${err.message || err}`));
        });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        try {
          const rows = results.data as any[];
          resolve(processInvoiceRows(rows, empresa));
        } catch (err: any) {
          reject(err);
        }
      },
      error: (err) => {
        reject(new Error(`Erro ao ler o arquivo CSV: ${err.message}`));
      }
    });
  });
};

// Alias para manter a compatibilidade com o CsvUploader existente sem quebrar a aplicação
export const processCsv = processInvoiceCsv;
