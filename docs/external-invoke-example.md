# 外部应用调用示例

## 示例 1：curl 触发收藏

```bash
curl -X POST http://127.0.0.1:3001/api/island/push \
  -H "Content-Type: application/json" \
  -d '{
    "plugin": "favorite-selection",
    "action": "collect",
    "payload": {
      "text": "这是一段需要收藏的文本内容"
    }
  }'
```

预期响应：

```json
{"code": 0, "message": "消息已投递"}
```

Island UI 依次显示：
1. "正在收藏..." (running, progress: 33%)
2. "正在收藏... (66%)" (running, progress: 66%)
3. "正在收藏... (100%)" (running, progress: 100%)
4. "已收藏: 这是一段需要收藏的..." (success)

---

## 示例 2：Python 调用

```python
import requests

resp = requests.post(
    'http://127.0.0.1:3001/api/island/push',
    json={
        'plugin': 'favorite-selection',
        'action': 'collect',
        'payload': {'text': 'Python 中选中的内容'}
    }
)
print(resp.json())
```

---

## 示例 3：Node.js 调用

```javascript
const http = require('http')

const body = JSON.stringify({
  plugin: 'favorite-selection',
  action: 'collect',
  payload: { text: 'Node.js 中选中的内容' }
})

const req = http.request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/island/push',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => console.log('Response:', data))
})

req.write(body)
req.end()
```

---

## 示例 4：AutoHotkey（Windows 全局快捷键）

```ahk
; 选中任意内容后按 Ctrl+Shift+F 触发收藏
^+f::
  Send, ^c
  Sleep, 100
  HTTP := ComObject("WinHTTP.WinHTTPRequest.5.1")
  HTTP.Open("POST", "http://127.0.0.1:3001/api/island/push", false)
  HTTP.SetRequestHeader("Content-Type", "application/json")
  body := '{"plugin":"favorite-selection","action":"collect","payload":{"text":"' . Clipboard . '"}}'
  HTTP.Send(body)
  return
```
