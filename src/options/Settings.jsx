import { capitalCase } from 'change-case'
// @mui
import { Box, Container, Tab, Tabs } from '@mui/material'

// hooks
import useTabs from '../hooks/useTabs'

import Iconify from '../components/Iconify'
import NotistackProvider from '../components/NotistackProvider'
import ThemeColorPresets from '../components/ThemeColorPresets'
import ThemeLocalization from '../components/ThemeLocalization'

// theme
import ThemeProvider from '../theme'

// sections
// import {
//   AccountBilling,
//   AccountChangePassword,
//   AccountGeneral,
//   AccountNotifications,
//   AccountSocialLinks,
// } from 'sections'

import AccountGeneral from './account/AccountGeneral'

// ----------------------------------------------------------------------

export default function UserAccount() {
  const { currentTab, onChangeTab } = useTabs('general')

  const ACCOUNT_TABS = [
    {
      value: 'general',
      icon: <Iconify icon={'ic:round-account-box'} width={20} height={20} />,
      component: <AccountGeneral />,
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
    <ThemeProvider>
      <ThemeColorPresets>
        <ThemeLocalization>
          <NotistackProvider>
            <Container>
              <div> Settings</div>
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

              <Box sx={{ mb: 5 }} />

              {ACCOUNT_TABS.map((tab) => {
                const isMatched = tab.value === currentTab
                return isMatched && <Box key={tab.value}>{tab.component}</Box>
              })}
            </Container>
          </NotistackProvider>
        </ThemeLocalization>
      </ThemeColorPresets>
    </ThemeProvider>
  )
}
