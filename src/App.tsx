/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router';
import { ToastContainer } from './components/ui/Toast';

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
      <ToastContainer />
    </AppProviders>
  );
}

