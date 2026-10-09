package com.mira.app.notifications

import android.app.Notification
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.ConcurrentHashMap

/**
 * Receives posted notifications. One from an app that is not switched on is dropped at once and
 * nothing is stored. Otherwise it goes into the native inbox and JavaScript is told, if it is
 * running. Message text is never logged.
 */
class MiraNotificationListener : NotificationListenerService() {

  override fun onListenerConnected() {
    // Pick up what was already showing when the listener started.
    val showing = try { activeNotifications } catch (e: SecurityException) { null } ?: return
    for (sbn in showing) capture(sbn)
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    capture(sbn)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification) {
    replyActions.remove(sbn.key)
  }

  private fun capture(sbn: StatusBarNotification) {
    if (sbn.packageName !in EnabledPackages.get(this)) return

    val captured = sbn.toCaptured()
    findReplyAction(sbn.notification)?.let { replyActions[sbn.key] = it }
    NativeInbox.get(this).add(captured)
    synchronized(recent) {
      recent.removeAll { it.key == captured.key }
      recent.addFirst(captured)
      while (recent.size > MAX_RECENT) recent.removeLast()
    }
    onCaptured?.invoke()
  }

  companion object {
    private const val MAX_RECENT = 30

    /** Set by the bridge module while JavaScript is running. */
    @Volatile var onCaptured: (() -> Unit)? = null

    private val recent = ArrayDeque<Captured>()
    private val replyActions = ConcurrentHashMap<String, Notification.Action>()

    /** For the developer probe: the latest captured notifications, newest first. */
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
