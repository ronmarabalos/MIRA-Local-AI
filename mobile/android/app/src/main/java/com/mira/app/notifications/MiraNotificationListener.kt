package com.mira.app.notifications

import android.app.Notification
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

/**
 * Receives posted notifications. Phase 1 probe: keeps the latest few from the probe apps in
 * memory so the developer screen can show what each app exposes. Nothing is written to storage,
 * and message text is never logged.
 */
class MiraNotificationListener : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    // Anything outside the probe apps is dropped here, before it is kept anywhere.
    if (sbn.packageName !in PROBE_PACKAGES) return

    val captured = sbn.toCaptured()
    findReplyAction(sbn.notification)?.let { replyActions[sbn.key] = it }
    synchronized(recent) {
      recent.removeAll { it.key == captured.key }
      recent.addFirst(captured)
      while (recent.size > MAX_RECENT) recent.removeLast()
    }
    Log.d(
        TAG,
        "pkg=${captured.packageName} textLen=${captured.text?.length ?: 0} " +
            "bigTextLen=${captured.bigText?.length ?: 0} messages=${captured.messages.size} " +
            "hasChatTitle=${captured.conversationTitle != null} group=${captured.isGroup} " +
            "canReply=${captured.canReply}",
    )
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification) {
    replyActions.remove(sbn.key)
  }

  companion object {
    private const val TAG = "MiraProbe"
    private const val MAX_RECENT = 30

    /** Messenger and Gmail, the two apps the first device checks are about. */
    val PROBE_PACKAGES = setOf("com.facebook.orca", "com.google.android.gm")

    private val recent = ArrayDeque<Captured>()
    private val replyActions = ConcurrentHashMap<String, Notification.Action>()

    fun recentNotifications(): List<Captured> = synchronized(recent) { recent.toList() }

    /** Sends text through the notification's own reply box. False if it is no longer showing. */
    fun sendReply(context: Context, key: String, text: String): Boolean {
      val action = replyActions[key] ?: return false
      val inputs = action.remoteInputs ?: return false
      val results = Bundle()
      for (input in inputs) results.putCharSequence(input.resultKey, text)
      val intent = Intent()
      RemoteInput.addResultsToIntent(inputs, intent, results)
      return try {
        action.actionIntent.send(context, 0, intent)
        true
      } catch (e: PendingIntent.CanceledException) {
        replyActions.remove(key)
        false
      }
    }
  }
}
