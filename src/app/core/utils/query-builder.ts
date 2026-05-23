import { HttpParams } from '@angular/common/http';
import {
  CustomFieldFilterParameter,
  FilterQueryOperation,
  FilterQueryParameter,
  PagingQueryParameters,
  SortDirection,
  SortQueryParameter
} from '../models/query-parameters.model';

type QueryValue = string | number | boolean | Date | null | undefined;

export class QueryBuilder {
  private paging: PagingQueryParameters = { Index: 0, Size: 20 };
  private filters: FilterQueryParameter[] = [];
  private sort: SortQueryParameter[] = [];
  private customFieldFilters: CustomFieldFilterParameter[] = [];

  setPage(index: number, size: number): this {
    this.paging = { Index: index, Size: size };
    return this;
  }

  get pageIndex(): number {
    return this.paging.Index;
  }

  get pageSize(): number {
    return this.paging.Size;
  }

  addFilter(fieldName: string, op: FilterQueryOperation, value: QueryValue): this {
    const stringValue = this.convertToString(value);
    if (stringValue === null) {
      return this;
    }

    const existingParam = this.filters.find(
      filter => filter.FieldName.toLowerCase() === fieldName.toLowerCase()
    );

    if (existingParam) {
      existingParam.Filter.push({ Op: op, Value: stringValue });
    } else {
      this.filters.push({
        FieldName: fieldName,
        Filter: [{ Op: op, Value: stringValue }]
      });
    }

    return this;
  }

  clearFilter(fieldName: string): this {
    this.filters = this.filters.filter(
      filter => filter.FieldName.toLowerCase() !== fieldName.toLowerCase()
    );
    return this;
  }

  clearAllFilters(): this {
    this.filters = [];
    return this;
  }

  addSort(fieldName: string, direction: SortDirection = SortDirection.Asc): this {
    const existingSort = this.sort.find(sort => sort.FieldName === fieldName);

    if (existingSort) {
      existingSort.Direction = direction;
    } else {
      this.sort.push({ FieldName: fieldName, Direction: direction });
    }

    return this;
  }

  clearSort(fieldName: string): this {
    this.sort = this.sort.filter(sort => sort.FieldName !== fieldName);
    return this;
  }

  clearAllSorts(): this {
    this.sort = [];
    return this;
  }

  addCustomFieldFilter(
    customFieldId: number,
    datatypeId: number,
    op: FilterQueryOperation,
    value: QueryValue
  ): this {
    const stringValue = this.convertToString(value);
    if (stringValue === null) {
      return this;
    }

    const existingFilter = this.customFieldFilters.find(
      filter => filter.CustomFieldId === customFieldId
    );

    if (existingFilter) {
      existingFilter.Filter.push({ Op: op, Value: stringValue });
    } else {
      this.customFieldFilters.push({
        CustomFieldId: customFieldId,
        DatatypeId: datatypeId,
        Filter: [{ Op: op, Value: stringValue }]
      });
    }

    return this;
  }

  clearCustomFieldFilter(customFieldId: number): this {
    this.customFieldFilters = this.customFieldFilters.filter(
      filter => filter.CustomFieldId !== customFieldId
    );
    return this;
  }

  clearAllCustomFieldFilters(): this {
    this.customFieldFilters = [];
    return this;
  }

  build(): HttpParams {
    let params = new HttpParams().set('paging', JSON.stringify(this.paging));

    if (this.filters.length > 0) {
      params = params.set('filters', JSON.stringify(this.filters));
    }

    if (this.sort.length > 0) {
      params = params.set('sort', JSON.stringify(this.sort));
    }

    if (this.customFieldFilters.length > 0) {
      params = params.set('customFieldFilters', JSON.stringify(this.customFieldFilters));
    }

    return params;
  }

  private convertToString(value: QueryValue): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }
}
