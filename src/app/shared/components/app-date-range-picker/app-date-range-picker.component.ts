import { ChangeDetectionStrategy, Component, forwardRef, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export interface AppDateRange {
  start: string;
  end: string;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './app-date-range-picker.component.html',
  styleUrl: './app-date-range-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppDateRangePickerComponent),
    multi: true
  }]
})
export class AppDateRangePickerComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly startLabel = input('COMMON.START_DATE');
  readonly endLabel = input('COMMON.END_DATE');
  readonly disabled = input(false);
  readonly error = input('');
  readonly hint = input('');

  readonly rangeChange = output<AppDateRange | null>();

  start = '';
  end = '';
  isDisabled = false;
  touched = false;

  private onChange: (value: AppDateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: AppDateRange | null): void {
    this.start = value?.start ?? '';
    this.end = value?.end ?? '';
  }

  registerOnChange(fn: (value: AppDateRange | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled = disabled;
  }

  setStart(event: Event): void {
    this.start = (event.target as HTMLInputElement).value;
    this.emitValue();
  }

  setEnd(event: Event): void {
    this.end = (event.target as HTMLInputElement).value;
    this.emitValue();
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  private emitValue(): void {
    const value = this.start || this.end ? { start: this.start, end: this.end } : null;
    this.onChange(value);
    this.rangeChange.emit(value);
  }
}
