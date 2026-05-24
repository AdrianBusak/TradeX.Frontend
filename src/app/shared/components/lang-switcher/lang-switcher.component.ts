import { Component, HostListener, inject, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface Lang {
  code: string;
  label: string;
}

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.scss'
})
export class LangSwitcherComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  readonly langs: Lang[] = [
    { code: 'en', label: 'EN' },
    { code: 'hr', label: 'HR' }
  ];

  open = false;

  get currentLang(): string {
    return (this.translate.currentLang || this.translate.defaultLang || 'en').toUpperCase();
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('tradex-lang');
    if (saved && this.langs.some(l => l.code === saved)) {
      this.translate.use(saved);
    }
  }

  select(code: string): void {
    this.translate.use(code);
    localStorage.setItem('tradex-lang', code);
    this.open = false;
  }

  toggle(): void {
    this.open = !this.open;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.open = false;
  }
}
