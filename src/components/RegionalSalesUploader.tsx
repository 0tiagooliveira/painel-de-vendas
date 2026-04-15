import React, { useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type CompanyKey = 'vitralab' | 'nativalab' | 'onix';

interface TotalsByName {
  name: string;
  total: number;
}

interface ProcessedDataset {
  company: CompanyKey;
  monthKey: string;
  monthLabel: string;
  regionTotals: TotalsByName[];
  cityTotals: TotalsByName[];
}

const COMPANY_LABELS: Record<CompanyKey, string> = {
  vitralab: 'Vitralab',
  nativalab: 'Nativalab',
  onix: 'Onix',
};

const UF_TO_REGION: Record<string, string> = {
  AC: 'Norte',
  AP: 'Norte',
  AM: 'Norte',
  PA: 'Norte',
  RO: 'Norte',
  RR: 'Norte',
  TO: 'Norte',
  AL: 'Nordeste',
  BA: 'Nordeste',
  CE: 'Nordeste',
  MA: 'Nordeste',
  PB: 'Nordeste',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RN: 'Nordeste',
  SE: 'Nordeste',
  DF: 'Centro-Oeste',
  GO: 'Centro-Oeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  ES: 'Sudeste',
  MG: 'Sudeste',
  RJ: 'Sudeste',
  SP: 'Sudeste',
  PR: 'Sul',
  RS: 'Sul',
  SC: 'Sul',
};

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const normalize = (value: string) =>
  value
    .replace(/\u00A0/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const index = Number(month) - 1;
  if (!Number.isInteger(index) || index < 0 || index > 11) return monthKey;
  return `${MONTH_LABELS[index]}/${year}`;
};

const parsePtBrMoney = (raw: string) => {
  const normalized = raw.replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCsvRow = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const extractCityUf = (cityUfRaw: string) => {
  const cleaned = cityUfRaw.replace(/\u00A0/g, ' ').trim();
  if (!cleaned) return { city: '', uf: '' };

  const ufMatch = cleaned.match(/-\s*([A-Za-z]{2})\s*$/);
  if (!ufMatch) return { city: cleaned, uf: '' };

  const uf = ufMatch[1].toUpperCase();
  const city = cleaned.replace(/-\s*[A-Za-z]{2}\s*$/, '').trim();
  return { city, uf };
};

const parseEmissionMonthKey = (emissionRaw: string) => {
  const match = emissionRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const month = match[2];
  const year = match[3];
  return `${year}-${month}`;
};

const buildDataset = (
  company: CompanyKey,
  monthKey: string,
  regionMap: Map<string, number>,
  cityMap: Map<string, number>
): ProcessedDataset => {
  const regionTotals = Array.from(regionMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const cityTotals = Array.from(cityMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    company,
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    regionTotals,
    cityTotals,
  };
};

export const RegionalSalesUploader: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<CompanyKey | ''>('');
  const [currentDataset, setCurrentDataset] = useState<ProcessedDataset | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const datasetsRef = useRef<Record<string, { regionMap: Map<string, number>; cityMap: Map<string, number> }>>({});
  const dedupeRef = useRef<Record<string, Set<string>>>({});

  const topRegion = useMemo(() => currentDataset?.regionTotals[0] ?? null, [currentDataset]);
  const topCity = useMemo(() => currentDataset?.cityTotals[0] ?? null, [currentDataset]);

  const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedCompany) {
      setError('Selecione a empresa antes de enviar o arquivo.');
      event.target.value = '';
      return;
    }

    try {
      const rawText = await file.text();
      const lines = rawText
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setError('CSV inválido: o arquivo precisa ter cabeçalho e linhas de dados.');
        event.target.value = '';
        return;
      }

      const delimiter = ';';
      const headerCells = parseCsvRow(lines[0], delimiter).map(normalize);

      const emissionIndex = headerCells.findIndex((h) => h === 'emissao');
      const valueIndex = headerCells.findIndex((h) => h === 'v.prod.');
      const cityUfIndex = headerCells.findIndex((h) => h === 'cidade / uf');
      const idIndex = headerCells.findIndex((h) => h === 'id.' || h === 'id');
      const nfIndex = headerCells.findIndex((h) => h === 'num/nf-e' || h === 'nfs-e');

      if (emissionIndex < 0 || valueIndex < 0 || cityUfIndex < 0) {
        setError('CSV inválido: esperado cabeçalho com Emissão, V.Prod. e Cidade / UF.');
        event.target.value = '';
        return;
      }

      const monthKeys = new Set<string>();
      const parsedRows: Array<{
        monthKey: string;
        region: string;
        city: string;
        value: number;
        recordKey: string;
      }> = [];

      for (let i = 1; i < lines.length; i += 1) {
        const cells = parseCsvRow(lines[i], delimiter);
        if (cells.every((cell) => !cell.trim())) continue;

        const firstCell = normalize(cells[0] || '');
        if (firstCell === 'totais' || firstCell === 'total') continue;

        const emissionRaw = (cells[emissionIndex] || '').trim();
        const valueRaw = (cells[valueIndex] || '').trim();
        const cityUfRaw = (cells[cityUfIndex] || '').trim();

        const monthKey = parseEmissionMonthKey(emissionRaw);
        if (!monthKey) continue;

        const { city, uf } = extractCityUf(cityUfRaw);
        const region = UF_TO_REGION[uf];
        const value = parsePtBrMoney(valueRaw);

        if (!city || !uf || !region || value <= 0) continue;

        monthKeys.add(monthKey);

        const idRaw = (idIndex >= 0 ? cells[idIndex] : '') || '';
        const nfRaw = (nfIndex >= 0 ? cells[nfIndex] : '') || '';
        const recordKeyBase = `${normalize(idRaw)}|${normalize(nfRaw)}|${normalize(emissionRaw)}|${normalize(cityUfRaw)}|${normalize(valueRaw)}`;

        parsedRows.push({
          monthKey,
          region,
          city,
          value,
          recordKey: recordKeyBase,
        });
      }

      if (parsedRows.length === 0) {
        setError('Nenhum lançamento válido foi encontrado no CSV.');
        event.target.value = '';
        return;
      }

      if (monthKeys.size !== 1) {
        setError('A planilha possui mais de um mês de referência em Emissão. Envie um mês por vez.');
        event.target.value = '';
        return;
      }

      const monthKey = Array.from(monthKeys)[0];
      const datasetKey = `${selectedCompany}|${monthKey}`;

      if (!datasetsRef.current[datasetKey]) {
        datasetsRef.current[datasetKey] = {
          regionMap: new Map<string, number>(),
          cityMap: new Map<string, number>(),
        };
      }

      if (!dedupeRef.current[datasetKey]) {
        dedupeRef.current[datasetKey] = new Set<string>();
      }

      const { regionMap, cityMap } = datasetsRef.current[datasetKey];
      const dedupeSet = dedupeRef.current[datasetKey];

      let importedCount = 0;
      let duplicateCount = 0;

      parsedRows.forEach((row) => {
        const scopedRecordKey = `${selectedCompany}|${row.monthKey}|${row.recordKey}`;

        if (dedupeSet.has(scopedRecordKey)) {
          duplicateCount += 1;
          return;
        }

        dedupeSet.add(scopedRecordKey);
        regionMap.set(row.region, (regionMap.get(row.region) || 0) + row.value);
        cityMap.set(row.city, (cityMap.get(row.city) || 0) + row.value);
        importedCount += 1;
      });

      const updatedDataset = buildDataset(selectedCompany, monthKey, regionMap, cityMap);

      setCurrentDataset(updatedDataset);
      setFileName(file.name);
      setError(null);
      setImportSummary(
        `${COMPANY_LABELS[selectedCompany]} ${updatedDataset.monthLabel}: ${importedCount} lançamentos adicionados e ${duplicateCount} duplicados ignorados.`
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Falha ao processar o arquivo CSV.');
    } finally {
      event.target.value = '';
    }
  };

  const clearCurrentDataset = () => {
    if (!currentDataset) return;

    const datasetKey = `${currentDataset.company}|${currentDataset.monthKey}`;
    delete datasetsRef.current[datasetKey];
    delete dedupeRef.current[datasetKey];

    setCurrentDataset(null);
    setImportSummary('Dados do período atual foram removidos.');
  };

  const clearAllData = () => {
    datasetsRef.current = {};
    dedupeRef.current = {};
    setCurrentDataset(null);
    setFileName('');
    setError(null);
    setImportSummary('Todos os dados importados foram removidos.');
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-zinc-100 text-lg font-semibold">Análise de Faturamento por Upload</h3>
        <p className="text-sm text-zinc-400">
          Envie o CSV de faturamento para gerar indicadores de vendas por região e por cidade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div className="md:col-span-1">
          <label className="block text-xs text-zinc-400 mb-1">De qual empresa é este arquivo?</label>
          <select
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value as CompanyKey | '')}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
          >
            <option value="">Selecione a empresa</option>
            <option value="vitralab">Vitralab</option>
            <option value="nativalab">Nativalab</option>
            <option value="onix">Onix</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer transition-colors">
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <p className="text-xs text-zinc-500 mt-2">Formato esperado: Emissão, V.Prod. e Cidade / UF com delimitador ;</p>
        </div>
      </div>

      {fileName && <p className="text-sm text-zinc-300">Arquivo carregado: {fileName}</p>}

      {importSummary && (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200">
          {importSummary}
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-900 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {currentDataset && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h4 className="text-zinc-100 text-xl font-semibold">
              {COMPANY_LABELS[currentDataset.company]} - Faturamento referente a {currentDataset.monthLabel}
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearCurrentDataset}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200"
              >
                Limpar período atual
              </button>
              <button
                type="button"
                onClick={clearAllData}
                className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-900 border border-red-700 text-red-100"
              >
                Limpar todos os dados
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Região com Maior Volume de Vendas</p>
              <p className="text-2xl font-bold text-white mt-1">{topRegion?.name || '-'}</p>
              <p className="text-sm text-zinc-300 mt-1">{topRegion ? formatCurrency(topRegion.total) : '-'}</p>
            </div>

            <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Cidade com Maior Volume de Vendas</p>
              <p className="text-2xl font-bold text-white mt-1">{topCity?.name || '-'}</p>
              <p className="text-sm text-zinc-300 mt-1">{topCity ? formatCurrency(topCity.total) : '-'}</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h5 className="text-zinc-200 text-sm font-medium uppercase tracking-wider mb-4">
              Vendas por Região (ordem decrescente)
            </h5>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentDataset.regionTotals} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="name" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Região: ${label}`}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
            <h5 className="text-zinc-200 text-sm font-medium uppercase tracking-wider mb-4">Vendas por Cidade</h5>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-2 pr-4">Cidade</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {currentDataset.cityTotals.map((row) => (
                  <tr key={row.name} className="hover:bg-zinc-800/40">
                    <td className="py-2 pr-4 text-zinc-200">{row.name}</td>
                    <td className="py-2 text-right text-zinc-300">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
