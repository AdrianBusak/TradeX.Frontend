import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnChanges, SimpleChanges, ViewChild, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, merge, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface AutocompleteOption {
  id: number;
  display: string;
  isActive: boolean;
}

@Component({
  selector: 'app-autocomplete-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './autocomplete-field.component.html',
  styleUrl: './autocomplete-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteFieldComponent),
      multi: true
    }
  ]
})
export class AutocompleteFieldComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() id = '';
  @Input() name = '';
  @Input() options: AutocompleteOption[] = [];
  @Input() nullable = false;
  @Input() pageSize: number = 5;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;
  @Input() showSelectedOnTop: boolean = true;
  @Input() loading = false;
  @Input() loadOnFocus = true;
  @Input() searchDebounceMs = 400;
  @Input() loader?: (search?: string, pageSize?: number) => void;
  @Output() opened = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  value: number | null = null;
  displayValue = '';
  isDisabled = false;
  isTouched = false;
  isFocused = false;
  hasMore = false;
  private visibleCount = this.pageSize;
  private requestedPageSize = this.pageSize;
  private lastFilter = '';
  private loaderHadSearch = false;
  private skipNextFocusedOptionsRefresh = false;

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;
  @ViewChild('inputEl') inputEl!: { nativeElement: HTMLInputElement };

  filteredOptions$!: Observable<AutocompleteOption[]>;
  inputControl = new FormControl('');
  private focusSubject = new BehaviorSubject<string>('');
  private readonly destroyRef = inject(DestroyRef);

  onChange = (_value: number | null) => {};
  onTouched = () => {};

  onDropdownClick(event: MouseEvent): void {
    event.preventDefault();
    this.inputEl.nativeElement.focus();
    if (this.autocompleteTrigger.panelOpen) {
      this.autocompleteTrigger.closePanel();
    } else {
      this.autocompleteTrigger.openPanel();
    }
  }

  ngOnInit(): void {
    this.visibleCount = this.pageSize;
    this.requestedPageSize = this.pageSize;

    this.filteredOptions$ = merge(
      this.focusSubject.asObservable(),
      this.inputControl.valueChanges.pipe(
        debounceTime(this.searchDebounceMs),
        distinctUntilChanged()
      )
    ).pipe(
      map(value => this._filter(value || ''))
    );

    this.inputControl.valueChanges.pipe(
      debounceTime(this.searchDebounceMs),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string' && this.isFocused) {
        const normalizedValue = value.trim();
        this.requestedPageSize = this.pageSize;
        this.visibleCount = this.pageSize;
        this.searchChange.emit(value);
        this.loader?.(normalizedValue || undefined, this.requestedPageSize);
        this.loaderHadSearch = !!normalizedValue;
      }
    });

    this.syncDisabledState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] || changes['loading']) {
      this.syncDisabledState();
    }

    if (changes['options']) {
      const selected = this.options.find(o => o.id === this.value);
      this.displayValue = selected ? selected.display : '';
      if (!this.isFocused) {
        this.inputControl.setValue(this.displayValue, { emitEvent: false });
      }
    }

    if (changes['options'] && !changes['options'].firstChange && this.isFocused) {
      if (this.skipNextFocusedOptionsRefresh) {
        this.skipNextFocusedOptionsRefresh = false;
        return;
      }

      const currentValue = this.inputControl.value;
      const stringValue = typeof currentValue === 'string' ? currentValue : '';
      this.focusSubject.next(stringValue);
      setTimeout(() => this.autocompleteTrigger?.openPanel(), 0);
    }
  }

  onInputFocus(): void {
    this.isFocused = true;
    this.opened.emit();

    if (this.loadOnFocus) {
      this.requestedPageSize = this.pageSize;
      this.visibleCount = this.pageSize;
      this.loader?.(this.loaderHadSearch ? '' : undefined, this.requestedPageSize);
      this.loaderHadSearch = false;
    }

    const currentValue = this.inputControl.value;
    const stringValue = typeof currentValue === 'string' ? currentValue : '';
    this.focusSubject.next(stringValue);
  }

  private _filter(filterValue: string | AutocompleteOption): AutocompleteOption[] {
    const filterString = typeof filterValue === 'string' ? filterValue : '';
    const filterValueLower = filterString.toLowerCase();

    if (filterString !== this.lastFilter) {
      this.lastFilter = filterString;
      this.visibleCount = this.pageSize;
      this.requestedPageSize = this.pageSize;
    }
    
    const selectedOption = this.value ? this.options.find(o => o.id === this.value) : null;
    
    let filtered = this.options.filter(option =>
      option.display.toLowerCase().includes(filterValueLower)
    );

    if (this.loader) {
      this.hasMore = filtered.length >= this.requestedPageSize;
    } else {
      this.hasMore = filtered.length > this.visibleCount;
    }
    
    if (this.showSelectedOnTop && selectedOption) {
      filtered = filtered.filter(o => o.id !== selectedOption.id);
      
      return [selectedOption, ...filtered.slice(0, this.visibleCount - 1)];
    }

    return filtered.slice(0, this.visibleCount);
  }

  loadMore(): void {
    const currentValue = this.inputControl.value;
    const stringValue = typeof currentValue === 'string' ? currentValue : '';
    const normalizedSearch = stringValue.trim();

    if (this.loader) {
      this.requestedPageSize += this.pageSize;
      this.visibleCount = this.requestedPageSize;
      this.loader(normalizedSearch, this.requestedPageSize);
    } else {
      this.visibleCount = this.visibleCount + this.pageSize;
      this.hasMore = this.options.length > this.visibleCount;
    }

    this.focusSubject.next(stringValue);
    setTimeout(() => this.autocompleteTrigger?.openPanel(), 0);
  }

  onLoadMoreClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.loadMore();
  }

  writeValue(value: number | null): void {
    this.value = value;
    this.syncSelectedDisplayValue();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.syncDisabledState();
  }

  get inputDisabled(): boolean {
    return this.isDisabled || this.disabled;
  }

  get hasEndAdornment(): boolean {
    return this.loading || !!this.loader || (!!this.value && !this.inputDisabled);
  }

  private syncDisabledState(): void {
    if (this.inputDisabled) {
      this.inputControl.disable({ emitEvent: false });
      return;
    }

    this.inputControl.enable({ emitEvent: false });
  }

  private syncSelectedDisplayValue(): void {
    if (this.value === null) {
      this.displayValue = '';
      this.inputControl.setValue('', { emitEvent: false });
      return;
    }

    const selected = this.options.find(option => option.id === this.value);
    if (!selected) {
      return;
    }

    this.displayValue = selected.display;
    this.inputControl.setValue(this.displayValue, { emitEvent: false });
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value;
    if (!option || option === null) {
      return;
    }

    this.skipNextFocusedOptionsRefresh = true;
    this.value = option.id;
    this.displayValue = option.display;
    this.inputControl.setValue(this.displayValue, { emitEvent: false });
    this.onChange(this.value);
    this.autocompleteTrigger?.closePanel();
  }

  displayWith = (value: AutocompleteOption | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.display || '';
  }

  onBlur(): void {
    this.skipNextFocusedOptionsRefresh = false;
    this.isFocused = false;
    this.isTouched = true;
    this.onTouched();

    const currentValue = this.inputControl.value;
    const inputString = typeof currentValue === 'string' ? currentValue : '';

    if (!inputString) {
      if (!this.nullable && this.value !== null) {
        this.value = null;
        this.displayValue = '';
        this.onChange(null);
      }
      return;
    }

    const matchedOption = this.options.find(o => 
      o.display.toLowerCase() === inputString.toLowerCase()
    );
    
    if (!matchedOption) {
      const currentlySelected = this.value ? this.options.find(o => o.id === this.value) : null;
      
      if (currentlySelected) {
        this.displayValue = currentlySelected.display;
        this.inputControl.setValue(this.displayValue, { emitEvent: false });
      } else if (!this.nullable) {
        this.inputControl.setValue('', { emitEvent: false });
        this.value = null;
        this.displayValue = '';
        this.onChange(null);
      } else if (this.nullable) {
        if (this.value !== null) {
          this.value = null;
          this.onChange(null);
        }
      }
    }
  }

  clearValue(): void {
    this.value = null;
    this.displayValue = '';
    this.inputControl.setValue('', { emitEvent: false });
    this.onChange(null);
  }
}
