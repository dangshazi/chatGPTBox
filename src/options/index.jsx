import { changeLanguage } from 'i18next'
import { render } from 'preact'
import Browser from 'webextension-polyfill'

import NotistackProvider from '../components/NotistackProvider'
import ThemeColorPresets from '../components/ThemeColorPresets'
import ThemeLocalization from '../components/ThemeLocalization'

import { HelmetProvider } from 'react-helmet-async'
import { SettingsProvider } from '../contexts/SettingsContext'
import MotionLazyContainer from '../components/animate/MotionLazyContainer'

// theme
import ThemeProvider from '../theme'

import '../_locales/i18n-react'
import { getPreferredLanguageKey } from '../config/index.mjs'
import Settings from './Settings'

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
    <SettingsProvider>
      <ThemeProvider>
        <ThemeColorPresets>
          <ThemeLocalization>
            <NotistackProvider>
              <MotionLazyContainer>
                <Settings />
              </MotionLazyContainer>
            </NotistackProvider>
          </ThemeLocalization>
        </ThemeColorPresets>
      </ThemeProvider>
    </SettingsProvider>
  </HelmetProvider>,
  document.getElementById('app'),
)
