import { changeLanguage } from 'i18next'
import { BrowserRouter } from 'react-router-dom'
import { render } from 'preact'
import Browser from 'webextension-polyfill'
import '../_locales/i18n-react'
import { getPreferredLanguageKey } from '../config/index.mjs'

import NotistackProvider from '../components/NotistackProvider'
import ThemeColorPresets from '../components/ThemeColorPresets'
import ThemeLocalization from '../components/ThemeLocalization'

import { SettingsProvider } from '../contexts/SettingsContext'

import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import { CollapseDrawerProvider } from '../contexts/CollapseDrawerContext'

// theme
import ThemeProvider from '../theme'

import { HelmetProvider } from 'react-helmet-async'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'
// redux
import { store, persistor } from '../redux/store'
import Router from '../routes'

// import ChatPage from './ChatPage'

document.body.style.margin = 0
document.body.style.overflow = 'hidden'
getPreferredLanguageKey().then((lang) => {
  changeLanguage(lang)
})
Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'CHANGE_LANG') {
    const data = message.data
    changeLanguage(data.lang)
  }
})
render(
  <HelmetProvider>
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <SettingsProvider>
            <ThemeProvider>
              <ThemeColorPresets>
                <ThemeLocalization>
                  <NotistackProvider>
                    <CollapseDrawerProvider>
                      <BrowserRouter>
                        <Router />
                      </BrowserRouter>
                    </CollapseDrawerProvider>
                  </NotistackProvider>
                </ThemeLocalization>
              </ThemeColorPresets>
            </ThemeProvider>
          </SettingsProvider>
        </LocalizationProvider>
      </PersistGate>
    </ReduxProvider>
  </HelmetProvider>,
  document.getElementById('app'),
)
