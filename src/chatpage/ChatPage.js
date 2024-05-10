import { useEffect } from 'react';

// @mui
import { Card, Container } from '@mui/material';
// redux
import { getContacts, getConversations } from '../redux/slices/chat';
import { useDispatch } from '../redux/store';


// routes
// import { PATH_DASHBOARD } from '../routes/paths';
// hooks
import useSettings from '../hooks/useSettings';
// components
// import HeaderBreadcrumbs from '../components/HeaderBreadcrumbs';
import Page from '../components/Page';
import { ChatSidebar, ChatWindow } from './chat';

// ----------------------------------------------------------------------

export default function ChatPage() {
  const { themeStretch } = useSettings();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getConversations());
    dispatch(getContacts());
  }, [dispatch]);

  return (
    <Page title="Chat">
      <Container
        maxWidth={themeStretch ? false : 'xl'}
        sx={{
          px: {
            xs: `0px`,
            lg: `24px`,
          },
        }}
      >
        {/* <HeaderBreadcrumbs
          heading="Chat"
          links={[{ name: 'Dashboard', href: PATH_DASHBOARD.root }, { name: 'Chat' }]}
        /> */}
        <Card sx={{ height: '100vh', display: 'flex' }}>
          <ChatSidebar />
          <ChatWindow />
        </Card>
      </Container>
    </Page>
  )
}
