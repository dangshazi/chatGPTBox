import { changeLanguage } from 'i18next'
import React from 'react'
import ReactDOM from 'react-dom'
import { MemoryRouter } from 'react-router-dom'

import Browser from 'webextension-polyfill'
import '../_locales/i18n-react'
import { getPreferredLanguageKey } from '../config/index.mjs'

// highlight
import '../utils/highlight'

// scroll bar
import 'simplebar/src/simplebar.css'

// lightbox
import 'react-image-lightbox/style.css'

// map
import 'mapbox-gl/dist/mapbox-gl.css'

// editor
import 'react-quill/dist/quill.snow.css'

// slick-carousel
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

// lazy image
import 'react-lazy-load-image-component/src/effects/blur.css'
import 'react-lazy-load-image-component/src/effects/opacity.css'
import 'react-lazy-load-image-component/src/effects/black-and-white.css'

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
import { AuthProvider } from '../contexts/JWTContext'

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
  <AuthProvider>
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
    </HelmetProvider>
  </AuthProvider>,
  document.getElementById('app'),
)
