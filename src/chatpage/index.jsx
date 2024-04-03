import { changeLanguage } from 'i18next'
import React from 'react'
import ReactDOM from 'react-dom'
import { MemoryRouter } from 'react-router-dom'
import Browser from 'webextension-polyfill'
import '../_locales/i18n-react'
import { getPreferredLanguageKey } from '../config/index.mjs'

import NotistackProvider from '../components/NotistackProvider'
import RtlLayout from '../components/RtlLayout'
import ThemeColorPresets from '../components/ThemeColorPresets'
import ThemeLocalization from '../components/ThemeLocalization'
import MotionLazyContainer from '../components/animate/MotionLazyContainer'

import { SettingsProvider } from '../contexts/SettingsContext'

import { CollapseDrawerProvider } from '../contexts/CollapseDrawerContext'

// theme
import ThemeProvider from '../theme'

import { HelmetProvider } from 'react-helmet-async'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'
// redux
import { persistor, store } from '../redux/store'
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

if (typeof window !== 'undefined') {
  window.React = React
}

ReactDOM.render(
  <HelmetProvider>
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* <LocalizationProvider dateAdapter={AdapterDateFns}> */}
        <SettingsProvider>
          <CollapseDrawerProvider>
            <MemoryRouter initialEntries={['/']}>
              <ThemeProvider>
                <ThemeColorPresets>
                  <ThemeLocalization>
                    <RtlLayout>
                      <NotistackProvider>
                        <MotionLazyContainer>
                          <Router />
                        </MotionLazyContainer>
                      </NotistackProvider>
                    </RtlLayout>
                  </ThemeLocalization>
                </ThemeColorPresets>
              </ThemeProvider>
            </MemoryRouter>
          </CollapseDrawerProvider>
        </SettingsProvider>
        {/* </LocalizationProvider> */}
      </PersistGate>
    </ReduxProvider>
  </HelmetProvider>,
  document.getElementById('app'),
)
