import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AppFieldSize } from '../app-input/app-input.component';

export type AppSelectValue = string | number | boolean | null;

export interface AppSelectOption {
  label: string;
  value: AppSelectValue;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [MatIcon, TranslatePipe],
  templateUrl: './app-select.component.html',
  styleUrl: './app-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppSelectComponent),
    multi: true
  }]
})
export class AppSelectComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly id = input('');
  readonly name = input('');
  readonly size = input<AppFieldSize>('md');
  readonly options = input<AppSelectOption[]>([]);
  readonly nullable = input(false);
  readonly prefixIcon = input<string>();

  value: AppSelectValue = null;
  selectedKey = '';
  isDisabled = false;
  touched = false;

  private onChange: (value: AppSelectValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: AppSelectValue): void {
    this.value = value;
    this.selectedKey = this.keyForValue(value);
  }

  registerOnChange(fn: (value: AppSelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled = disabled;
  }

  onSelection(event: Event): void {
    const key = (event.target as HTMLSelectElement).value;
    this.selectedKey = key;
    this.value = this.valueForKey(key);
    this.onChange(this.value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  optionKey(index: number): string {
    return `option-${index}`;
  }

  private keyForValue(value: AppSelectValue): string {
    if (value === null) return '';
    const index = this.options().findIndex(option => option.value === value);
    return index >= 0 ? this.optionKey(index) : '';
  }

  private valueForKey(key: string): AppSelectValue {
    if (!key) return null;
    const index = Number(key.replace('option-', ''));
    return this.options()[index]?.value ?? null;
  }
}
