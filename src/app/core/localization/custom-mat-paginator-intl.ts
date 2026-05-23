import { Injectable, inject, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Injectable()
export class CustomMatPaginatorIntl extends MatPaginatorIntl implements OnDestroy {
  private translateService = inject(TranslateService);
  private langChangeSub: Subscription;

  constructor() {
    super();
    
    this.getTranslations();

    this.langChangeSub = this.translateService.onLangChange.subscribe(() => {
      this.getTranslations();
    });
  }

  private getTranslations(): void {
    this.translateService.get([
      'COMMON.PAGINATOR.ITEMS_PER_PAGE',
      'COMMON.PAGINATOR.NEXT_PAGE',
      'COMMON.PAGINATOR.PREVIOUS_PAGE',
      'COMMON.PAGINATOR.FIRST_PAGE',
      'COMMON.PAGINATOR.LAST_PAGE'
    ]).subscribe(translations => {
      this.itemsPerPageLabel = translations['COMMON.PAGINATOR.ITEMS_PER_PAGE'];
      this.nextPageLabel = translations['COMMON.PAGINATOR.NEXT_PAGE'];
      this.previousPageLabel = translations['COMMON.PAGINATOR.PREVIOUS_PAGE'];
      this.firstPageLabel = translations['COMMON.PAGINATOR.FIRST_PAGE'];
      this.lastPageLabel = translations['COMMON.PAGINATOR.LAST_PAGE'];
      
      this.changes.next(); 
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const ofLabel = this.translateService.instant('COMMON.PAGINATOR.OF');
    
    if (length === 0 || pageSize === 0) {
      return `0 ${ofLabel} ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} - ${endIndex} ${ofLabel} ${length}`;
  };

  ngOnDestroy(): void {
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe();
    }
  }
}