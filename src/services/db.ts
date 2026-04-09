import { collection, doc, onSnapshot, writeBatch, setDoc, query, orderBy, where, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MonthlyData } from '../types';
import { getCurrentMonthId } from '../utils/dateUtils';
import { ProcessedCsvRow } from '../utils/csvProcessor';

const COLLECTION_NAME = 'sales_data';
const INVOICES_COLLECTION = 'invoices';

export const listenToSalesData = (callback: (data: MonthlyData[]) => void, onError?: (error: Error) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('id', 'asc'));

  return onSnapshot(q, async (snapshot) => {
    const currentMonthId = getCurrentMonthId();

    if (snapshot.empty) {
      // Seed automático se a coleção estiver vazia
      const initialData: MonthlyData = {
        id: currentMonthId,
        vitralab: 0,
        onixlab: 0,
        nativalab: 0,
        meta: 0,
        notes: 'Mês atual.'
      };
      
      try {
        await setDoc(doc(db, COLLECTION_NAME, currentMonthId), initialData);
        // O listener será disparado novamente após essa gravação
      } catch (error) {
        console.error("Erro ao fazer o seed inicial:", error);
        if (onError && error instanceof Error) onError(error);
      }
      return;
    }

    const data: MonthlyData[] = snapshot.docs.map(docSnapshot => {
      const docData = docSnapshot.data();
      const isCurrent = docData.id === currentMonthId;
      
      // Ajuste dinâmico da nota "Mês atual."
      let notes = docData.notes || '';
      if (isCurrent) {
        if (!notes.includes('Mês atual.')) {
          notes = notes ? `${notes} Mês atual.` : 'Mês atual.';
        }
      } else {
        notes = notes.replace('Mês atual.', '').trim();
      }

      return {
        id: docData.id,
        vitralab: docData.vitralab || 0,
        onixlab: docData.onixlab || 0,
        nativalab: docData.nativalab || 0,
        meta: docData.meta || 0,
        notes,
        isCurrentMonth: isCurrent
      };
    });

    callback(data);
  }, (error) => {
    console.error("Erro ao escutar dados de vendas:", error);
    if (onError) onError(error);
  });
};

export const updateCompanyMonthTotal = async (monthId: string, empresa: string, total: number) => {
  const docRef = doc(db, COLLECTION_NAME, monthId);
  const dataToSave = {
    id: monthId,
    [empresa.toLowerCase()]: total
  };
  
  try {
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar total da empresa:", error);
    throw error;
  }
};

export const updateMonthMeta = async (monthId: string, meta: number) => {
  const docRef = doc(db, COLLECTION_NAME, monthId);

  try {
    await setDoc(docRef, { id: monthId, meta }, { merge: true });
  } catch (error) {
    console.error('Erro ao atualizar a meta do mes:', error);
    throw error;
  }
};

export const saveMonthlyDataBatch = async (dataArray: MonthlyData[]) => {
  const batch = writeBatch(db);

  dataArray.forEach((data) => {
    const docRef = doc(db, COLLECTION_NAME, data.id);
    
    // Remove a propriedade calculada isCurrentMonth antes de salvar
    const { isCurrentMonth, ...dataToSave } = data;
    
    batch.set(docRef, dataToSave, { merge: true });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Erro ao salvar o batch de dados:", error);
    throw error;
  }
};

export const saveInvoiceBatch = async (dataArray: ProcessedCsvRow[]) => {
  const chunks = [];
  for (let i = 0; i < dataArray.length; i += 500) {
    chunks.push(dataArray.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((data) => {
      const docRef = doc(db, INVOICES_COLLECTION, data.uniqueKey);
      batch.set(docRef, data, { merge: true });
    });
    await batch.commit();
  }
};

export const deleteInvoicesByMonthAndCompany = async (monthId: string, empresa: string) => {
  const q = query(
    collection(db, INVOICES_COLLECTION), 
    where('mesId', '==', monthId), 
    where('empresa', '==', empresa)
  );
  
  const snapshot = await getDocs(q);
  
  const chunks = [];
  for (let i = 0; i < snapshot.docs.length; i += 500) {
    chunks.push(snapshot.docs.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  const monthDocRef = doc(db, COLLECTION_NAME, monthId);
  const monthDocSnap = await getDoc(monthDocRef);

  // Nothing to adjust if month row does not exist.
  if (!monthDocSnap.exists()) return;

  const monthData = monthDocSnap.data() as Partial<MonthlyData>;
  const companyKey = empresa.toLowerCase() as keyof Pick<MonthlyData, 'vitralab' | 'onixlab' | 'nativalab'>;

  const nextMonthData = {
    vitralab: monthData.vitralab || 0,
    onixlab: monthData.onixlab || 0,
    nativalab: monthData.nativalab || 0,
    meta: monthData.meta || 0,
    notes: monthData.notes || '',
    [companyKey]: 0,
  };

  const hasAnySales = nextMonthData.vitralab > 0 || nextMonthData.onixlab > 0 || nextMonthData.nativalab > 0;
  const hasMeta = nextMonthData.meta > 0;
  const isCurrentMonth = monthId === getCurrentMonthId();

  // Remove historical month rows when they become numerically empty.
  // Notes are intentionally ignored here to avoid stale tags keeping dead rows alive.
  if (!hasAnySales && !hasMeta && !isCurrentMonth) {
    await deleteDoc(monthDocRef);
    return;
  }

  // Otherwise keep the row and only clear the deleted company's value.
  await updateCompanyMonthTotal(monthId, empresa, 0);
};

export const deleteInvoicesByMonth = async (monthId: string) => {
  const q = query(collection(db, INVOICES_COLLECTION), where('mesId', '==', monthId));
  const snapshot = await getDocs(q);

  const companiesInMonth = new Set<string>();
  snapshot.docs.forEach((docSnap) => {
    const invoice = docSnap.data() as Partial<ProcessedCsvRow>;
    if (invoice.empresa) companiesInMonth.add(invoice.empresa);
  });

  const chunks = [];
  for (let i = 0; i < snapshot.docs.length; i += 500) {
    chunks.push(snapshot.docs.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  const monthDocRef = doc(db, COLLECTION_NAME, monthId);
  const monthDocSnap = await getDoc(monthDocRef);
  if (!monthDocSnap.exists()) return;

  // Zero only the companies that had imported invoices for this month.
  for (const company of companiesInMonth) {
    await updateCompanyMonthTotal(monthId, company, 0);
  }

  // Re-read after updates and remove historical month if it became empty.
  const refreshedMonthDoc = await getDoc(monthDocRef);
  if (!refreshedMonthDoc.exists()) return;

  const refreshedData = refreshedMonthDoc.data() as Partial<MonthlyData>;
  const hasAnySales = (refreshedData.vitralab || 0) > 0 || (refreshedData.onixlab || 0) > 0 || (refreshedData.nativalab || 0) > 0;
  const hasMeta = (refreshedData.meta || 0) > 0;
  const isCurrentMonth = monthId === getCurrentMonthId();

  if (!hasAnySales && !hasMeta && !isCurrentMonth) {
    await deleteDoc(monthDocRef);
  }
};

export const listenToInvoices = (callback: (data: ProcessedCsvRow[]) => void) => {
  const q = query(collection(db, INVOICES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as ProcessedCsvRow);
    callback(data);
  }, (error) => {
    console.error("Erro ao escutar faturas:", error);
  });
};
