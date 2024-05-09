import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';

// ----------------------------------------------------------------------

function objFromArray(array, key = 'id') {
  return array.reduce((accumulator, current) => {
    accumulator[current[key]] = current;
    return accumulator;
  }, {});
}

const initialState = {
  isLoading: false,
  error: null,
  contacts: { byId: {}, allIds: [] },
  conversations: { byId: {}, allIds: [] },
  activeConversationId: null,
  participants: [],
  recipients: [],
};

const mergeAndSortConversation = (localConversation, remoteConversation) => {
  const localMessages = localConversation.messages
  const remoteMessages = remoteConversation.messages
  // 合并两个数组
  const mergedMessages = [...localMessages, ...remoteMessages]

  // 使用reduce方法来创建一个映射对象，键为id，值为消息对象
  const messagesMap = mergedMessages.reduce((acc, message) => {
    const msgId = message.id
    acc[msgId] = message
    return acc
  }, {})

  // 将映射对象转换为数组，并使用Object.values来获取值（即消息对象）
  const uniqueMessages = Object.values(messagesMap)

  // 根据createdAt属性进行排序，如果createdAt相同，则保持原顺序（稳定排序）
  uniqueMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return {
    ...localConversation,
    messages: uniqueMessages,
  }
}

const slice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true
    },

    // HAS ERROR
    hasError(state, action) {
      state.isLoading = false
      state.error = action.payload
    },

    // GET CONTACT SSUCCESS
    getContactsSuccess(state, action) {
      const contacts = action.payload

      state.contacts.byId = objFromArray(contacts)
      state.contacts.allIds = Object.keys(state.contacts.byId)
    },

    // GET CONVERSATIONS
    getConversationsSuccess(state, action) {
      const conversations = action.payload
      // Merge with existing conversations

      conversations.forEach((conversation) => {
        if (!state.conversations.allIds.includes(conversation.id)) {
          state.conversations.byId[conversation.id] = conversation
          state.conversations.allIds.push(conversation.id)
        } else {
          // Merge with existing conversation
          state.conversations.byId[conversation.id] = mergeAndSortConversation(
            state.conversations.byId[conversation.id],
            conversation,
          )
        }
      })
    },

    // GET CONVERSATION
    getConversationSuccess(state, action) {
      const conversation = action.payload
      if (conversation) {
        if (!state.conversations.allIds.includes(conversation.id)) {
          state.conversations.allIds.push(conversation.id)
          state.conversations.byId[conversation.id] = conversation
        } else {
          // Merge with existing conversation
          const mergedConversation = mergeAndSortConversation(
            state.conversations.byId[conversation.id],
            conversation,
          )
          state.conversations.byId[conversation.id] = mergedConversation
        }
        state.activeConversationId = conversation.id
      } else {
        state.activeConversationId = null
      }
    },

    // ON SEND MESSAGE
    onSendMessage(state, action) {
      const conversationMsg = action.payload
      const {
        conversationId,
        messageId,
        error,
        message,
        contentType,
        attachments,
        createdAt,
        senderId,
      } = conversationMsg

      const newMessage = {
        id: messageId,
        body: message,
        error,
        contentType,
        attachments,
        createdAt,
        senderId,
      }

      state.conversations.byId[conversationId].messages.push(newMessage)
    },

    // ON UPDATE MESSAGE
    onUpdateMessage(state, action) {
      const conversationMsg = action.payload
      const {
        conversationId,
        messageId,
        error,
        message,
        contentType,
        attachments,
        createdAt,
        senderId,
      } = conversationMsg

      const newMessage = {
        id: messageId,
        body: message,
        error,
        contentType,
        attachments,
        createdAt,
        senderId,
      }
      let updated = false
      state.conversations.byId[conversationId].messages = state.conversations.byId[
        conversationId
      ].messages.map((message) => {
        if (message.id === messageId) {
          updated = true
          return newMessage
        }
        return message
      })
      if (!updated) {
        state.conversations.byId[conversationId].messages.push(newMessage)
      }
    },

    markConversationAsReadSuccess(state, action) {
      const { conversationId } = action.payload
      const conversation = state.conversations.byId[conversationId]
      if (conversation) {
        conversation.unreadCount = 0
      }
    },

    // GET PARTICIPANTS
    getParticipantsSuccess(state, action) {
      const participants = action.payload
      state.participants = participants
    },

    // RESET ACTIVE CONVERSATION
    resetActiveConversation(state) {
      state.activeConversationId = null
    },

    addRecipients(state, action) {
      const recipients = action.payload
      state.recipients = recipients
    },
  },
})

// Reducer
export default slice.reducer;

// Actions
export const { addRecipients, onSendMessage, onUpdateMessage, resetActiveConversation } = slice.actions;

// ----------------------------------------------------------------------

export function getContacts() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get('/api/chat/contacts');
      dispatch(slice.actions.getContactsSuccess(response.data.contacts));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// ----------------------------------------------------------------------

export function getConversations() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get('/api/chat/conversations');
      dispatch(slice.actions.getConversationsSuccess(response.data.conversations));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// ----------------------------------------------------------------------

export function getConversation(conversationKey) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get('/api/chat/conversation', {
        params: { conversationKey },
      });
      dispatch(slice.actions.getConversationSuccess(response.data.conversation));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// ----------------------------------------------------------------------

export function markConversationAsRead(conversationId) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      await axios.get('/api/chat/conversation/mark-as-seen', {
        params: { conversationId },
      });
      dispatch(slice.actions.markConversationAsReadSuccess({ conversationId }));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// ----------------------------------------------------------------------

export function getParticipants(conversationKey) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get('/api/chat/participants', {
        params: { conversationKey },
      });
      dispatch(slice.actions.getParticipantsSuccess(response.data.participants));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
