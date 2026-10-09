package com.mira.app.reminders

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.mira.app.R

/** Shows a reminder when its alarm fires. Reminders are local: nothing leaves the phone. */
class ReminderReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    val title = intent.getStringExtra(EXTRA_TITLE) ?: return
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
          NotificationChannel(CHANNEL, "Reminders", NotificationManager.IMPORTANCE_HIGH))
    }
    val open =
        context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
          PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE)
        }
    val notification =
        NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Reminder")
            .setContentText(title)
            .setStyle(NotificationCompat.BigTextStyle().bigText(title))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
    try {
      manager.notify(intent.getIntExtra(EXTRA_ID, 0), notification)
    } catch (e: SecurityException) {
      // The user has not allowed notifications.
    }
  }

  companion object {
    private const val CHANNEL = "reminders"
    private const val EXTRA_TITLE = "title"
    private const val EXTRA_ID = "id"

    /** The same title and time always give the same alarm, so it can be found again. */
    private fun pendingFor(context: Context, title: String, at: Long): PendingIntent {
      val id = (title.hashCode() * 31 + at.hashCode())
      val intent =
          Intent(context, ReminderReceiver::class.java)
              .putExtra(EXTRA_TITLE, title)
              .putExtra(EXTRA_ID, id)
      return PendingIntent.getBroadcast(
          context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun cancel(context: Context, title: String, at: Long) {
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarms.cancel(pendingFor(context, title, at))
    }

    fun schedule(context: Context, title: String, at: Long) {
      val pending = pendingFor(context, title, at)
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
      if (exact) {
        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
      } else {
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
      }
    }
  }
}
