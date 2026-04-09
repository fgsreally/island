# 插件通信协议

## 概述

外部应用通过本地 HTTP POST 向 Island 主窗口推送消息，消息经由 Rust 侧 HTTP 服务器转发到对应插件的 `onMessage()` 方法。

## 端点

```
POST http://127.0.0.1:3001/api/island/push
Content-Type: application/json
```

## 请求体

```json
{
  "plugin": "favorite-selection",
  "action": "collect",
  "payload": {
    "text": "用户选中的内容"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| plugin | string | 是 | 插件 ID |
| action | string | 是 | 动作标识（插件自定义） |
| payload | object | 否 | 附加数据 |

## 响应

成功时返回 `200 OK`：

```json
{
  "code": 0,
  "message": "消息已投递"
}
```

失败时返回 `4xx/5xx`：

```json
{
  "code": 404,
  "message": "插件不存在: unknown-plugin"
}
```

## 状态订阅

外部应用可通过 WebSocket 订阅任务状态变更（规划中）：

```
ws://127.0.0.1:3002/ws/island/status
```

## 插件注册

插件需在 `plugins/enabled.json` 中声明才可被调用。
