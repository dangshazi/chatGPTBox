import { capitalCase } from 'change-case'
// @mui
import { Box, Card, Container, Tab, Tabs, Typography } from '@mui/material'

// hooks
import useTabs from '../hooks/useTabs'

import Iconify from '../components/Iconify'

import AccountProfile from './account/AccountProfile'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultConfig, getPreferredLanguageKey, setUserConfig } from '../config/index.mjs'

import Page from '../components/Page'
import { AdvancedConfig } from './sections/AdvancedConfig'
import { GeneralConfig } from './sections/GeneralConfig'
import { GptModelConfig } from './sections/GptModelConfig'

// ----------------------------------------------------------------------

export default function UserAccount() {
  const { currentTab, onChangeTab } = useTabs('general')
  const [config, setConfig] = useState(defaultConfig)
  // const [currentVersion, setCurrentVersion] = useState('')
  // const [latestVersion, setLatestVersion] = useState('')

  const { t, i18n } = useTranslation()
  const updateConfig = (value) => {
    // 这里保存了两份配置，一份是默认的配置，一份是UserConfig
    setConfig({ ...config, ...value })
    setUserConfig(value)
  }

  useEffect(() => {
    // changeLanguage
    getPreferredLanguageKey().then((lang) => {
      i18n.changeLanguage(lang)
    })

    // getUserConfig().then((config) => {
    //   setConfig(config)
    //   setCurrentVersion(Browser.runtime.getManifest().version.replace('v', ''))
    //   // 访问 github api来获取最新的版本号
    //   fetch('https://api.github.com/repos/josstorer/chatGPTBox/releases/latest').then((response) =>
    //     response.json().then((data) => {
    //       setLatestVersion(data.tag_name.replace('v', ''))
    //     }),
    //   )
    // })
  }, [])

  const ACCOUNT_TABS = [
    {
      value: 'general',
      icon: <Iconify icon={'ic:round-settings-input-component'} width={20} height={20} />,
      component: <GeneralConfig config={config} updateConfig={updateConfig} />,
    },

    {
      value: 'advanced',
      icon: <Iconify icon={'ic:round-admin-panel-settings'} width={20} height={20} />,
      component: <AdvancedConfig config={config} updateConfig={updateConfig} />,
    },

    {
      value: 'gpt_model',
      icon: <Iconify icon={'ic:round-calculate'} width={20} height={20} />,
      component: <GptModelConfig config={config} updateConfig={updateConfig} />,
    },

    {
      value: 'account',
      icon: <Iconify icon={'ic:round-account-box'} width={20} height={20} />,
      component: <AccountProfile />,
    },
    // {
    //   value: 'billing',
    //   icon: <Iconify icon={'ic:round-receipt'} width={20} height={20} />,
    //   component: (
    //     <AccountBilling
    //       cards={_userPayment}
    //       addressBook={_userAddressBook}
    //       invoices={_userInvoices}
    //     />
    //   ),
    // },
    // {
    //   value: 'notifications',
    //   icon: <Iconify icon={'eva:bell-fill'} width={20} height={20} />,
    //   component: <AccountNotifications />,
    // },
    // {
    //   value: 'social_links',
    //   icon: <Iconify icon={'eva:share-fill'} width={20} height={20} />,
    //   component: <AccountSocialLinks myProfile={_userAbout} />,
    // },
    // {
    //   value: 'change_password',
    //   icon: <Iconify icon={'ic:round-vpn-key'} width={20} height={20} />,
    //   component: <AccountChangePassword />,
    // },
  ]

  return (
    <Page title="User Settings">
      <Container>
        <Box sx={{ mb: 5 }} />
        <Card>
          <Typography display="flex" alignItems="center" variant="h4" sx={{ margin: 2 }}>
            <Iconify icon={'eva:settings-fill'} sx={{ fontSize: 30 }} />
            {t('Settings')}
          </Typography>
        </Card>
        <Tabs
          allowScrollButtonsMobile
          variant="scrollable"
          scrollButtons="auto"
          value={currentTab}
          onChange={onChangeTab}
        >
          {ACCOUNT_TABS.map((tab) => (
            <Tab
              disableRipple
              key={tab.value}
              label={capitalCase(tab.value)}
              icon={tab.icon}
              value={tab.value}
            />
          ))}
        </Tabs>

        <Box sx={{ mb: 1 }} />

        {ACCOUNT_TABS.map((tab) => {
          const isMatched = tab.value === currentTab
          return isMatched && <Box key={tab.value}>{tab.component}</Box>
        })}
      </Container>
    </Page>
  )
}
