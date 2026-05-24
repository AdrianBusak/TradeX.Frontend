import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-decimal-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './decimal-field.component.html',
  styleUrl: './decimal-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DecimalFieldComponent),
      multi: true
    }
  ]
})
export class DecimalFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() hint = '';
  @Input() id = '';
  @Input() name = '';
  @Input() disabled = false;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step = 0.01;
  @Input() decimalPlaces = 2;

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

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value ? Number(input.value) : null;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.isTouched = true;
    this.onTouched();
  }
}
