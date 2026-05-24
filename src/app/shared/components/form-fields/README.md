# Form Fields Components

Reusable form field components with built-in validation, error handling, and translations.

## Available Components

### 1. Text Field (`app-text-field`)
Standard text input field.

```typescript
import { TextFieldComponent } from '@app/shared/components/form-fields';
```

```html
<app-text-field
  [label]="'FORM.NAME'"
  [placeholder]="'FORM.ENTER_NAME'"
  [required]="true"
  [errorMessage]="getErrorMessage('name')"
  [id]="'subject-name'"
  [name]="'subject-name'"
  formControlName="name">
</app-text-field>
```

### 2. Email Field (`app-email-field`)
Email input with type="email".

```html
<app-email-field
  [label]="'FORM.EMAIL'"
  [placeholder]="'FORM.ENTER_EMAIL'"
  [required]="true"
  [errorMessage]="getErrorMessage('email')"
  formControlName="email">
</app-email-field>
```

### 3. Number Field (`app-number-field`)
Integer number input.

```html
<app-number-field
  [label]="'FORM.QUANTITY'"
  [placeholder]="'FORM.ENTER_QUANTITY'"
  [min]="0"
  [max]="100"
  [step]="1"
  [errorMessage]="getErrorMessage('quantity')"
  formControlName="quantity">
</app-number-field>
```

### 4. Date Field (`app-date-field`)
Date picker input.

```html
<app-date-field
  [label]="'FORM.DATE'"
  [placeholder]="'FORM.SELECT_DATE'"
  [min]="'2024-01-01'"
  [max]="'2025-12-31'"
  [errorMessage]="getErrorMessage('date')"
  formControlName="date">
</app-date-field>
```

### 5. Decimal Field (`app-decimal-field`)
Decimal/float number input.

```html
<app-decimal-field
  [label]="'FORM.PRICE'"
  [placeholder]="'FORM.ENTER_PRICE'"
  [step]="0.01"
  [decimalPlaces]="2"
  [errorMessage]="getErrorMessage('price')"
  formControlName="price">
</app-decimal-field>
```

### 6. Select / Dropdown (`app-select-field`)
Select field for choosing from a list of options.

```typescript
import { SelectFieldComponent, SelectOption } from '@app/shared/components/form-fields';
```

```html
<app-select-field
  [label]="'FORM.ROLE'"
  [placeholder]="'FORM.SELECT_ROLE'"
  [required]="true"
  [errorMessage]="getErrorMessage('roleId')"
  [options]="roleOptions"
  [id]="'role'"
  [name]="'role'"
  formControlName="roleId">
</app-select-field>
```

```typescript
roleOptions: SelectOption[] = [
  { id: 1, display: 'ROLES.USER', isActive: true },
  { id: 2, display: 'ROLES.MANAGER', isActive: true },
  { id: 3, display: 'ROLES.ADMIN', isActive: true }
];
```

### 7. Autocomplete (`app-autocomplete-field`)
Autocomplete text field with option list.

```typescript
import { AutocompleteFieldComponent, AutocompleteOption } from '@app/shared/components/form-fields';
```

```html
<app-autocomplete-field
  [label]="'FORM.USER'"
  [placeholder]="'FORM.SEARCH_USER'"
  [required]="true"
  [pageSize]="10"
  [errorMessage]="getErrorMessage('userId')"
  [options]="userOptions"
  [id]="'user'"
  [name]="'user'"
  formControlName="userId">
</app-autocomplete-field>
```

```typescript
userOptions: AutocompleteOption[] = [
  { id: 101, display: 'John Doe', isActive: true },
  { id: 102, display: 'Jane Smith', isActive: true }
];
```

## Properties

### Common Properties (all components)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Field label (translation key) |
| `placeholder` | `string` | `''` | Placeholder text (translation key) |
| `required` | `boolean` | `false` | Shows asterisk (*) next to label |
| `errorMessage` | `string` | `''` | Error message (translation key) |
| `hint` | `string` | `''` | Helper text below input |
| `disabled` | `boolean` | `false` | Disables the input |
| `id` | `string` | `''` | HTML id attribute |
| `name` | `string` | `''` | HTML name attribute |

### Number/Decimal Specific

| Property | Type | Description |
|----------|------|-------------|
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `step` | `number` | Increment step |
| `decimalPlaces` | `number` | Number of decimal places (decimal-field only) |

### Date Specific

| Property | Type | Description |
|----------|------|-------------|
| `min` | `string` | Minimum date (YYYY-MM-DD) |
| `max` | `string` | Maximum date (YYYY-MM-DD) |

### Select Specific

| Property | Type | Description |
|----------|------|-------------|
| `options` | `SelectOption[]` | List of options (`id`, `display`, `isActive`) |
| `nullable` | `boolean` | Adds a null/empty option |

### Autocomplete Specific

| Property | Type | Description |
|----------|------|-------------|
| `options` | `AutocompleteOption[]` | List of options (`id`, `display`, `isActive`) |
| `nullable` | `boolean` | Allows empty selection |
| `pageSize` | `number` | Max results shown in dropdown |

## Usage in Component

### 1. Import the component

```typescript
import { TextFieldComponent, EmailFieldComponent } from '@app/shared/components/form-fields';

@Component({
  // ...
  imports: [
    // ...
    TextFieldComponent,
    EmailFieldComponent
  ]
})
```

### 2. Use with Reactive Forms

```typescript
export class MyFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) return 'ERRORS.REQUIRED';
    if (control.errors['email']) return 'ERRORS.INVALID_EMAIL';
    if (control.errors['minlength']) {
      return 'ERRORS.MIN_LENGTH';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }
}
```

### 3. Use in Template

```html
<form [formGroup]="form">
  <app-text-field
    [label]="'FORM.NAME'"
    [placeholder]="'FORM.ENTER_NAME'"
    [required]="true"
    [errorMessage]="getErrorMessage('name')"
    [id]="'user-name'"
    [name]="'user-name'"
    formControlName="name">
  </app-text-field>

  <app-email-field
    [label]="'FORM.EMAIL'"
    [placeholder]="'FORM.ENTER_EMAIL'"
    [required]="true"
    [errorMessage]="getErrorMessage('email')"
    formControlName="email">
  </app-email-field>
</form>
```

## Migration Guide

### Before (old pattern):

```html
<div class="form-field-group">
  <label class="field-label">{{ 'ADD_SUBJECT_DIALOG.FIELDS.NAME' | translate }} *</label>
  <input
    id="subject-name"
    name="subject-name"
    type="text" 
    formControlName="name" 
    class="form-input" 
    [placeholder]="'ADD_SUBJECT_DIALOG.PLACEHOLDERS.NAME' | translate"
  >
  @if (isFieldInvalid('name')) {
    <div class="field-hint error">{{ getErrorMessage('name') | translate }}</div>
  }
</div>
```

### After (new pattern):

```html
<app-text-field
  [label]="'ADD_SUBJECT_DIALOG.FIELDS.NAME'"
  [placeholder]="'ADD_SUBJECT_DIALOG.PLACEHOLDERS.NAME'"
  [required]="true"
  [errorMessage]="getErrorMessage('name')"
  [id]="'subject-name'"
  [name]="'subject-name'"
  formControlName="name">
</app-text-field>
```

## Benefits

- ✅ Consistent UI across the application
- ✅ Less boilerplate code
- ✅ Built-in validation display
- ✅ Automatic translation handling
- ✅ Accessibility attributes
- ✅ Easy to maintain and update
- ✅ Type-safe with TypeScript
- ✅ Works with Angular Reactive Forms

## Next Steps

For custom field types (Country, Currency), extend these base components or create new ones following the same pattern.
