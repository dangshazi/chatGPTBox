import { capitalCase } from 'change-case'
// @mui
import { Container, Tab, Box, Tabs } from '@mui/material'

// hooks
import useTabs from '../../hooks/useTabs'
import useSettings from '../../hooks/useSettings'
// _mock_
import { _userPayment, _userAddressBook, _userInvoices, _userAbout } from '../../_mock'

import Iconify from '../../components/Iconify'

// sections
import {
  AccountGeneral,
  AccountBilling,
  AccountSocialLinks,
  AccountNotifications,
  AccountChangePassword,
} from '../../sections/@dashboard/user/account'

// ----------------------------------------------------------------------

export default function UserAccount() {
  const { themeStretch } = useSettings()

  const { currentTab, onChangeTab } = useTabs('general')

  const ACCOUNT_TABS = [
    {
      value: 'general',
      icon: <Iconify icon={'ic:round-account-box'} width={20} height={20} />,
      component: <AccountGeneral />,
    },
    {
      value: 'billing',
      icon: <Iconify icon={'ic:round-receipt'} width={20} height={20} />,
      component: (
        <AccountBilling
          cards={_userPayment}
          addressBook={_userAddressBook}
          invoices={_userInvoices}
        />
      ),
    },
    {
      value: 'notifications',
      icon: <Iconify icon={'eva:bell-fill'} width={20} height={20} />,
      component: <AccountNotifications />,
    },
    {
      value: 'social_links',
      icon: <Iconify icon={'eva:share-fill'} width={20} height={20} />,
      component: <AccountSocialLinks myProfile={_userAbout} />,
    },
    {
      value: 'change_password',
      icon: <Iconify icon={'ic:round-vpn-key'} width={20} height={20} />,
      component: <AccountChangePassword />,
    },
  ]

  return (
    <Container maxWidth={themeStretch ? false : 'lg'}>
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
  )
}
