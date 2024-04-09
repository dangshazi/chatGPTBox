import { createParser } from './eventsource-parser.mjs'

// Server-Sent Events（SSE）是一种允许服务器主动向客户端发送事件的技术。与传统的HTTP请求不同，SSE在客户端建立一个到服务器的单向连接，服务器可以通过这个连接发送消息给客户端，而客户端不能通过这个连接发送消息回服务器（与WebSocket相比，WebSocket是全双工的）
// https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html
export async function fetchSSE(resource, options) {
  const { onMessage, onStart, onEnd, onError, ...fetchOptions } = options
  const resp = await fetch(resource, fetchOptions).catch(async (err) => {
    await onError(err)
  })
  if (!resp) return
  if (!resp.ok) {
    await onError(resp)
    return
  }
  // 解析event：https://www.npmjs.com/package/eventsource-parser/v/1.1.1
  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data)
    }
  })
  let hasStarted = false
  const reader = resp.body.getReader()
  let result
  // 每次读取一部分：eg. https://platform.openai.com/docs/api-reference/chat/create
  while (!(result = await reader.read()).done) {
    const chunk = result.value
    // 第一次读取的时候为什么要做这么一个处理？ common response又是什么
    if (!hasStarted) {
      const str = new TextDecoder().decode(chunk)
      hasStarted = true
      await onStart(str)

      let fakeSseData
      try {
        const commonResponse = JSON.parse(str)
        fakeSseData = 'data: ' + JSON.stringify(commonResponse) + '\n\ndata: [DONE]\n\n'
      } catch (error) {
        // 只有是common response的时候，才会生成fakeSseData
        console.debug('not common response', error)
      }
      if (fakeSseData) {
        parser.feed(new TextEncoder().encode(fakeSseData))
        break
      }
    }
    parser.feed(chunk)
  }
  await onEnd()
}
