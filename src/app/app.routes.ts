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
        path: 'ml-prediction',
        data: { titleKey: 'NAV.ML_PREDICTION', title: 'ML Prediction', subtitle: 'Prepare model-driven trade insights and signal review.', icon: 'model_training' },
        loadComponent: () => import('./features/ml-prediction/ml-prediction.component').then(m => m.MlPredictionComponent)
      },
      {
        path: 'lot-calculator',
        data: { titleKey: 'NAV.LOT_CALCULATOR', icon: 'calculate' },
        loadComponent: () => import('./features/lot-calculator/lot-calculator-page.component').then(m => m.LotCalculatorPageComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
