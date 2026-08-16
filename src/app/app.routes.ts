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
        path: 'trading-accounts',
        data: { titleKey: 'NAV.TRADING_ACCOUNTS', icon: 'account_balance' },
        loadComponent: () =>
          import('./features/trading-accounts/list/trading-accounts-list.component')
            .then(m => m.TradingAccountsListComponent)
      },
      {
        path: 'trading-accounts/create',
        data: { titleKey: 'TRADING_ACCOUNTS.CREATE_TITLE' },
        loadComponent: () =>
          import('./features/trading-accounts/form/trading-account-form.component')
            .then(m => m.TradingAccountFormComponent)
      },
      {
        path: 'trading-accounts/:id/edit',
        data: { titleKey: 'TRADING_ACCOUNTS.EDIT_TITLE' },
        loadComponent: () =>
          import('./features/trading-accounts/form/trading-account-form.component')
            .then(m => m.TradingAccountFormComponent)
      },
      {
        path: 'trades',
        data: { titleKey: 'NAV.TRADES', icon: 'candlestick_chart' },
        loadComponent: () =>
          import('./features/trades/list/trades-list.component')
            .then(m => m.TradesListComponent)
      },
      {
        path: 'trades/create',
        data: { titleKey: 'TRADES.CREATE_TITLE' },
        loadComponent: () =>
          import('./features/trades/form/trade-form.component')
            .then(m => m.TradeFormComponent)
      },
      {
        path: 'trades/:id/edit',
        data: { titleKey: 'TRADES.EDIT_TITLE' },
        loadComponent: () =>
          import('./features/trades/form/trade-form.component')
            .then(m => m.TradeFormComponent)
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
        data: { titleKey: 'NAV.STRATEGIES', icon: 'schema' },
        loadComponent: () =>
          import('./features/strategies/list/strategies-list.component')
            .then(m => m.StrategiesListComponent)
      },
      {
        path: 'strategies/create',
        data: { titleKey: 'STRATEGIES.CREATE_TITLE' },
        loadComponent: () =>
          import('./features/strategies/form/strategy-form.component')
            .then(m => m.StrategyFormComponent)
      },
      {
        path: 'strategies/:id/edit',
        data: { titleKey: 'STRATEGIES.EDIT_TITLE' },
        loadComponent: () =>
          import('./features/strategies/form/strategy-form.component')
            .then(m => m.StrategyFormComponent)
      },
      {
        path: 'economic-calendar',
        data: { title: 'Economic Calendar', icon: 'calendar_month' },
        loadComponent: () => import('./features/economic-calendar/economic-calendar.component').then(m => m.EconomicCalendarComponent)
      },
      {
        path: 'mistakes',
        data: { titleKey: 'NAV.MISTAKES', icon: 'warning_amber' },
        loadComponent: () => import('./features/mistakes/list/mistakes-list.component').then(m => m.MistakesListComponent)
      },
      {
        path: 'mistakes/create',
        data: { titleKey: 'MISTAKES.ADD' },
        loadComponent: () => import('./features/mistakes/form/mistake-form.component').then(m => m.MistakeFormComponent)
      },
      {
        path: 'mistakes/:id/edit',
        data: { titleKey: 'MISTAKES.EDIT' },
        loadComponent: () => import('./features/mistakes/form/mistake-form.component').then(m => m.MistakeFormComponent)
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
