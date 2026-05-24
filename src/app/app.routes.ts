import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        data: { titleKey: 'NAV.DASHBOARD' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'trades',
        data: {
          titleKey: 'NAV.TRADES',
          title: 'Trades',
          subtitle: 'Review executions, tags, setups and outcomes.',
          icon: 'candlestick_chart',
          emptyTitle: 'No trades imported yet',
          emptyDescription: 'Trade import and manual entry screens can now use the new form, table and badge system.'
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(m => m.PlaceholderPageComponent)
      },
      {
        path: 'journal',
        data: {
          titleKey: 'NAV.JOURNAL',
          title: 'Journal',
          subtitle: 'Capture trade notes, emotions, screenshots and review routines.',
          icon: 'edit_note',
          emptyTitle: 'Start your first journal entry',
          emptyDescription: 'The journal area is ready for rich form fields and reusable cards.'
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(m => m.PlaceholderPageComponent)
      },
      {
        path: 'strategies',
        data: { titleKey: 'NAV.STRATEGIES', title: 'Strategies', subtitle: 'Track setup quality and strategy performance.', icon: 'schema' },
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent)
      },
      {
        path: 'risk',
        data: { titleKey: 'NAV.RISK', title: 'Risk', subtitle: 'Monitor exposure, drawdown and rule compliance.', icon: 'shield' },
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent)
      },
      {
        path: 'analytics',
        data: { titleKey: 'NAV.ANALYTICS', title: 'Analytics', subtitle: 'Find performance patterns across markets and sessions.', icon: 'monitoring' },
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent)
      },
      {
        path: 'ml-prediction',
        data: { titleKey: 'NAV.ML_PREDICTION', title: 'ML Prediction', subtitle: 'Prepare model-driven trade insights and signal review.', icon: 'model_training' },
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent)
      },
      {
        path: 'settings',
        data: { titleKey: 'NAV.SETTINGS', title: 'Settings', subtitle: 'Manage account preferences and workspace defaults.', icon: 'settings' },
        loadComponent: () => import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
