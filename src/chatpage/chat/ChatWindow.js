import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom'
// @mui
import { Box, Divider, Stack, Typography } from '@mui/material'
// redux
import {
  addRecipients,
  getConversation,
  getParticipants,
  markConversationAsRead,
  onSendMessage,
  resetActiveConversation,
} from '../../redux/slices/chat'
import { useDispatch, useSelector } from '../../redux/store'
// routes
import { PATH_DASHBOARD } from '../../routes/paths';
//
import ChatHeaderCompose from './ChatHeaderCompose'
import ChatHeaderDetail from './ChatHeaderDetail';
import ChatMessageInput from './ChatMessageInput';
import ChatMessageList from './ChatMessageList'
import ChatRoom from './ChatRoom'

import usePort from '../../hooks/usePort'

// ----------------------------------------------------------------------

const conversationSelector = (state) => {
  const { conversations, activeConversationId } = state.chat;
  const conversation = activeConversationId ? conversations.byId[activeConversationId] : null;
  if (conversation) {
    return conversation;
  }
  const initState = {
    id: '',
    messages: [],
    participants: [],
    unreadCount: 0,
    type: '',
  };
  return initState;
};

export default function ChatWindow() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isReady, postMessage, unfinishedAnswer, answerType } = usePort()
  const { pathname } = useLocation()
  const { conversationKey } = useParams()
  const { contacts, recipients, participants, activeConversationId } = useSelector(
    (state) => state.chat,
  )
  const conversation = useSelector((state) => conversationSelector(state))

  const mode = conversationKey ? 'DETAIL' : 'COMPOSE'
  const displayParticipants = participants.filter(
    (item) => item.id !== '8864c717-587d-472a-929a-8e5f298024da-0',
  )

  useEffect(() => {
    const getDetails = async () => {
      dispatch(getParticipants(conversationKey))
      try {
        await dispatch(getConversation(conversationKey))
      } catch (error) {
        console.error(error)
        navigate(PATH_DASHBOARD.chat.new)
      }
    }
    if (conversationKey) {
      getDetails()
    } else if (activeConversationId) {
      dispatch(resetActiveConversation())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationKey])

  useEffect(() => {
    if (activeConversationId) {
      dispatch(markConversationAsRead(activeConversationId))
    }
  }, [dispatch, activeConversationId])

  const handleAddRecipients = (recipients) => {
    dispatch(addRecipients(recipients))
  }

  const handleSendMessage = async (value) => {
    try {
      dispatch(onSendMessage(value))
      // 发送消息到backgroud
      postMessage(value)
    } catch (error) {
      console.error(error)
    }
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

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Stack sx={{ flexGrow: 1 }}>
          {/* 主要聊天内容 */}
          <ChatMessageList conversation={conversation} />
          <Typography>{unfinishedAnswer}</Typography>
          <Typography>{answerType}</Typography>

          <Divider />

          <ChatMessageInput
            conversationId={activeConversationId}
            onSend={handleSendMessage}
            disabled={pathname === PATH_DASHBOARD.chat.new || !isReady}
          />
        </Stack>

        {/* 对话右侧的详细信息 */}
        {mode === 'DETAIL' && (
          <ChatRoom conversation={conversation} participants={displayParticipants} />
        )}
      </Box>
    </Stack>
  )
}
