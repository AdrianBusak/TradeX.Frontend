import { Directive, Input, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[appTabItem]',
  standalone: true
})
export class TabItemDirective {
  @Input({ required: true }) label!: string;
  @Input() key?: string;
  @Input() icon?: string;

  public template = inject(TemplateRef);
}