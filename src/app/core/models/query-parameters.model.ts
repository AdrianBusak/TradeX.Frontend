export enum FilterQueryOperation {
  Eq = 'Eq',
  Neq = 'Neq',
  Contains = 'Contains',
  StartsWith = 'StartsWith',
  EndsWith = 'EndsWith',
  Gt = 'Gt',
  Gte = 'Gte',
  Lt = 'Lt',
  Lte = 'Lte'
}

export enum SortDirection {
  Asc = 'Asc',
  Desc = 'Desc'
}

export interface PagingQueryParameters {
  Index: number;
  Size: number;
}

export interface FilterQueryCondition {
  Op: FilterQueryOperation;
  Value: string;
}

export interface FilterQueryParameter {
  FieldName: string;
  Filter: FilterQueryCondition[];
}

export interface SortQueryParameter {
  FieldName: string;
  Direction: SortDirection;
}

export interface CustomFieldFilterParameter {
  CustomFieldId: number;
  DatatypeId: number;
  Filter: FilterQueryCondition[];
}
