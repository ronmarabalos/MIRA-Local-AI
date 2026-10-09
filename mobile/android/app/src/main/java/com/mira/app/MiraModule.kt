package com.mira.app

import android.Manifest
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.TrafficStats
import android.os.Process
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.mira.app.notifications.MiraNotificationListener

/** Bridge methods. Kotlin holds no product logic: it only reports and acts for JavaScript. */
class MiraModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  override fun getName(): String = "MiraModule"

  @ReactMethod
  fun isListenerEnabled(promise: Promise) {
    val context = reactApplicationContext
    val enabled =
        NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
    promise.resolve(enabled)
  }

  @ReactMethod
  fun openListenerSettings(promise: Promise) {
    val intent =
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactApplicationContext.startActivity(intent)
    promise.resolve(null)
  }

  /** Probe only: the latest notifications from the probe apps, newest first. */
  @ReactMethod
  fun getRecentNotifications(promise: Promise) {
    val list = Arguments.createArray()
    for (captured in MiraNotificationListener.recentNotifications()) list.pushMap(captured.toMap())
    promise.resolve(list)
  }

  @ReactMethod
  fun sendReply(key: String, text: String, promise: Promise) {
    val sent = MiraNotificationListener.sendReply(reactApplicationContext, key, text)
    promise.resolve(if (sent) "sent" else "gone")
  }

  @ReactMethod
  fun getProofFacts(promise: Promise) {
    val context = reactApplicationContext
    val facts = Arguments.createMap()
    facts.putBoolean(
        "hasInternetPermission",
        context.checkSelfPermission(Manifest.permission.INTERNET) ==
            PackageManager.PERMISSION_GRANTED,
    )
    // Counted since the phone last started, not since install. Unsupported devices report -1.
    val sent = TrafficStats.getUidTxBytes(Process.myUid())
    if (sent == TrafficStats.UNSUPPORTED.toLong()) {
      facts.putNull("bytesSent")
    } else {
      facts.putDouble("bytesSent", sent.toDouble())
    }
    facts.putBoolean(
        "isDebugBuild",
        (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0,
    )
    promise.resolve(facts)
  }

  /** Where the model file is copied to over USB. Readable by the app with no permission. */
  @ReactMethod
  fun getModelDir(promise: Promise) {
    promise.resolve(reactApplicationContext.getExternalFilesDir(null)?.absolutePath)
  }
}
