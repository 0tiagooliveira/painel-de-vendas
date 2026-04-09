import Papa from 'papaparse';

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

export const parseBrazilianCurrency = (value: string): number => {
  if (!value) return 0;
  const cleanStr = String(value).replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

export const extractMonthId = (emissao: string): string | null => {
  if (!emissao) return null;
  const parts = String(emissao).trim().split(' ');
  if (!parts[0]) return null;
  
  const dateParts = parts[0].split('/');
  if (dateParts.length >= 3) {
    return `${dateParts[2]}-${dateParts[1]}`;
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

export const processInvoiceCsv = (file: File, empresa: EmpresaType): Promise<{ data: ProcessedCsvRow[], errors: string[], monthId: string }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        try {
          const rows = results.data as any[];
          const processed: ProcessedCsvRow[] = [];
          const errors: string[] = [];
          let mainMonthId: string | null = null;

          rows.forEach((row, index) => {
            const idCol = row['Id.'] || row['id.'] || row['ID.'] || row['Id'] || row['id'];
            if (idCol && String(idCol).trim().toLowerCase() === 'totais') {
              return;
            }

            const emissao = row['Emissão'];
            const vProdStr = row['V.Prod.'];

            if (!emissao || !vProdStr) {
              return;
            }

            const vProd = parseBrazilianCurrency(vProdStr);
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

            const cidadeKey = Object.keys(row).find(k => k.toLowerCase().includes('cidade'));
            const cidadeUf = cidadeKey ? row[cidadeKey] : '';
            const { cidade, uf, regiao } = splitCityAndUF(cidadeUf);
            
            const numNf = row['Núm/NF-e'] || row['NF-e'] || String(index);
            const uniqueKey = `${empresa}-${monthId}-${numNf}-${vProd}`;

            processed.push({
              id: uniqueKey, // Mantido para compatibilidade com o hook existente
              uniqueKey,
              empresa,
              mesId: monthId,
              emissao,
              vProd,
              cidade,
              uf,
              regiao
            });
          });

          if (!mainMonthId) {
            throw new Error("Nenhum dado válido encontrado no arquivo.");
          }

          resolve({ data: processed, errors, monthId: mainMonthId });

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
