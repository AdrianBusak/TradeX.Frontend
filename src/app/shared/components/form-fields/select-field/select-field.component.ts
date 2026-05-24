import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

export interface SelectOption {
  id: number;
  display: string;
  isActive: boolean;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSelectModule, MatOptionModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true
    }
  ]
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() id = '';
  @Input() name = '';
  @Input() options: SelectOption[] = [];
  @Input() nullable = false;
  @Input() disabled = false;
  @Input() loading = false;

  value: number | null = null;
  isDisabled = false;
  isTouched = false;

  onChange = (_value: number | null) => {};
  onTouched = () => {};

  writeValue(value: number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectionChange(value: number | null): void {
    this.value = value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.isTouched = true;
    this.onTouched();
  }

  getSelectedDisplay(): string {
    if (this.value == null) {
      return '';
    }

    const selected = this.options.find(option => option.id === this.value);
    return selected?.display ?? '';
  }
}
