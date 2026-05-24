import { Component, input, inject, signal, contentChildren, untracked, OnInit, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { TabItemDirective } from './tab-item.directive';
import { Observable, take, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tabs-layout',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule],
  templateUrl: './tabs-layout.component.html',
  styleUrl: './tabs-layout.component.scss'
})
export class TabsLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  tabs = contentChildren(TabItemDirective);

  canChangeTab = input<() => Observable<boolean>>();

  selectedIndex = signal<number>(0);
  selectedIndexChange = output<number>();

  ngOnInit() {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const tabParam = params['tab'];
      if (tabParam) {
        const indexByKey = this.tabs().findIndex(t => t.key === tabParam);
        if (indexByKey !== -1) {
          this.selectedIndex.set(indexByKey);
          this.selectedIndexChange.emit(indexByKey);
        } else if (!Number.isNaN(Number(tabParam))) {
          const index = Number(tabParam);
          this.selectedIndex.set(index);
          this.selectedIndexChange.emit(index);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(newIndex: number) {
    const oldIndex = untracked(() => this.selectedIndex());
    if (newIndex === oldIndex) return;

    if (this.canChangeTab()) {
      this.canChangeTab()!()
        .pipe(take(1))
        .subscribe(isAllowed => {
          if (!isAllowed) {
            this.selectedIndex.set(oldIndex);
            return;
          }

          this.selectedIndex.set(newIndex);
          this.updateUrl(newIndex);
          this.selectedIndexChange.emit(newIndex);
        });
      return;
    }

    this.selectedIndex.set(newIndex);
    this.updateUrl(newIndex);
    this.selectedIndexChange.emit(newIndex);
  }

  private updateUrl(index: number) {
    const tab = this.tabs()[index];
    const tabValue = tab?.key ? tab.key : index.toString();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabValue },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}