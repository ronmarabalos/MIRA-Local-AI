package com.mira.app.notifications

import android.app.Notification
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import org.json.JSONArray
import org.json.JSONObject

/** One message inside a notification that uses Android's messaging style. */
data class CapturedMessage(val sender: String, val text: String, val time: Long)

/** A notification as handed to JavaScript. Mirrors CapturedNotification in src/core/types.ts. */
data class Captured(
    val key: String,
    val packageName: String,
    val postedAt: Long,
    val title: String?,
    val text: String?,
    val bigText: String?,
    val conversationTitle: String?,
    val isGroup: Boolean,
    val messages: List<CapturedMessage>,
    val category: String?,
    val isOngoing: Boolean,
    val canReply: Boolean,
) {
  /** The same fields as [toMap], as JSON text for the inbox. */
  fun toJson(): String {
    val list = JSONArray()
    for (message in messages) {
      list.put(
          JSONObject()
              .put("sender", message.sender)
              .put("text", message.text)
              .put("time", message.time))
    }
    return JSONObject()
        .put("key", key)
        .put("packageName", packageName)
        .put("postedAt", postedAt)
        .put("title", title ?: JSONObject.NULL)
        .put("text", text ?: JSONObject.NULL)
        .put("bigText", bigText ?: JSONObject.NULL)
        .put("conversationTitle", conversationTitle ?: JSONObject.NULL)
        .put("isGroup", isGroup)
        .put("messages", list)
        .put("category", category ?: JSONObject.NULL)
        .put("isOngoing", isOngoing)
        .put("canReply", canReply)
        .toString()
  }

  fun toMap(): WritableMap {
    val map = Arguments.createMap()
    map.putString("key", key)
    map.putString("packageName", packageName)
    map.putDouble("postedAt", postedAt.toDouble())
    map.putString("title", title)
    map.putString("text", text)
    map.putString("bigText", bigText)
    map.putString("conversationTitle", conversationTitle)
    map.putBoolean("isGroup", isGroup)
    val list = Arguments.createArray()
    for (message in messages) {
      val item = Arguments.createMap()
      item.putString("sender", message.sender)
      item.putString("text", message.text)
      item.putDouble("time", message.time.toDouble())
      list.pushMap(item)
    }
    map.putArray("messages", list)
    map.putString("category", category)
    map.putBoolean("isOngoing", isOngoing)
    map.putBoolean("canReply", canReply)
    return map
  }
}

/** The action that carries a free-text reply box, if the notification offers one. */
fun findReplyAction(notification: Notification): Notification.Action? =
    notification.actions?.firstOrNull { action ->
      action.remoteInputs?.any { it.allowFreeFormInput } == true
    }

fun StatusBarNotification.toCaptured(): Captured {
  val posted = notification
  val extras = posted.extras
  val style = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(posted)
  val messages =
      style?.messages.orEmpty().map {
        CapturedMessage(
            sender = it.person?.name?.toString() ?: "",
            text = it.text?.toString() ?: "",
            time = it.timestamp,
        )
      }
  return Captured(
      key = key,
      packageName = packageName,
      postedAt = postTime,
      title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
      text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString(),
      bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString(),
      conversationTitle = style?.conversationTitle?.toString(),
      isGroup = style?.isGroupConversation ?: false,
      messages = messages,
      category = posted.category,
      isOngoing = isOngoing,
      canReply = findReplyAction(posted) != null,
  )
}
