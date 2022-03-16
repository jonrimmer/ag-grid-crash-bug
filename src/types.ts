export interface DataItem {
  id: string;
  label: string;
  count: number;
  description: string;
  tags: string[];
  type: string;
  source: string;
  longDescription: string;
  location: string;
}

export interface DataItemRow extends DataItem {
  path: string[];
}
