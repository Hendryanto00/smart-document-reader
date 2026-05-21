import type { PageServerLoad } from './$types';
import { filterDocuments, uniqueDocDates } from '$lib/filter-documents';
import { listAllDocuments, rowToView } from '$lib/server/db';

export const load: PageServerLoad = async ({ platform, url }) => {
  const db = platform?.env?.DB;
  if (!db) {
    return {
      documents: [],
      filters: { vendor: '', dateFrom: '', dateTo: '' },
      total: 0,
      availableDates: [] as string[]
    };
  }

  let vendor = (url.searchParams.get('vendor') ?? '').trim();
  let dateFrom = (url.searchParams.get('dateFrom') ?? '').trim();
  let dateTo = (url.searchParams.get('dateTo') ?? '').trim();

  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }

  const all = (await listAllDocuments(db)).map(rowToView);
  const availableDates = uniqueDocDates(all);
  const documents = filterDocuments(all, {
    vendor: vendor || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined
  });

  return {
    documents,
    total: documents.length,
    totalAll: all.length,
    availableDates,
    filters: { vendor, dateFrom, dateTo }
  };
};
