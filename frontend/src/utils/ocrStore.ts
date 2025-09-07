export type OcrItem = {
  id: string;
  text: string;
  entities: Array<{ label: string; value: string }>;
  createdAt: string;
  updatedAt?: string;
};

const KEY = 'ocr_history_v1';

export function loadOcrItems(): OcrItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OcrItem[]) : [];
  } catch {
    return [];
  }
}

export function saveOcrItems(items: OcrItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addOcrItem(item: OcrItem): OcrItem[] {
  const items = loadOcrItems();
  const next = [item, ...items];
  saveOcrItems(next);
  return next;
}

export function updateOcrItem(item: OcrItem): OcrItem[] {
  const items = loadOcrItems();
  const next = items.map((i) => (i.id === item.id ? item : i));
  saveOcrItems(next);
  return next;
}

export function deleteOcrItem(id: string): OcrItem[] {
  const items = loadOcrItems();
  const next = items.filter((i) => i.id !== id);
  saveOcrItems(next);
  return next;
}


