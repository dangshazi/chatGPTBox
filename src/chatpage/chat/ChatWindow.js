import { useEffect } from 'react';
import { useParams } from 'react-router-dom'
// @mui
import { Divider, Stack } from '@mui/material'
// redux
import { addRecipients, getParticipants, resetActiveConversation } from '../../redux/slices/chat'
import { useDispatch, useSelector } from '../../redux/store'
//
import { PortProvider } from '../../contexts/PortContext'
import ChatHeaderCompose from './ChatHeaderCompose'
import ChatHeaderDetail from './ChatHeaderDetail';
import ChatMessageFrame from './ChatMessageFrame'

export default function ChatWindow() {
  const dispatch = useDispatch()
  const { conversationKey } = useParams()
  const { contacts, recipients, participants, activeConversationId } = useSelector(
    (state) => state.chat,
  )

  const mode = conversationKey ? 'DETAIL' : 'COMPOSE'
  const displayParticipants = participants.filter(
    (item) => item.id !== '8864c717-587d-472a-929a-8e5f298024da-0',
  )

  useEffect(() => {
    const getParticipantsDetails = async () => {
      dispatch(getParticipants(conversationKey))
    }
    if (conversationKey) {
      getParticipantsDetails()
    } else if (activeConversationId) {
      dispatch(resetActiveConversation())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationKey])

  const handleAddRecipients = (recipients) => {
    dispatch(addRecipients(recipients))
  }

  return (
    <Stack sx={{ flexGrow: 1, minWidth: '1px' }}>
      {mode === 'DETAIL' ? (
        <ChatHeaderDetail participants={displayParticipants} />
      ) : (
        <ChatHeaderCompose
          recipients={recipients}
          contacts={Object.values(contacts.byId)}
          onAddRecipients={handleAddRecipients}
        />
      )}

      <Divider />

      <PortProvider name={'chat'}>
        <ChatMessageFrame />
      </PortProvider>
    </Stack>
  )
}
