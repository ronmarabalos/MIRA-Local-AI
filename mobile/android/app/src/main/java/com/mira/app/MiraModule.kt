package com.mira.app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.TrafficStats
import android.os.Process
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.mira.app.notifications.EnabledPackages
import com.mira.app.notifications.MiraNotificationListener
import com.mira.app.notifications.NativeInbox
import java.io.File

/** Bridge methods. Kotlin holds no product logic: it only reports and acts for JavaScript. */
class MiraModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  override fun getName(): String = "MiraModule"

  private val connectivity: ConnectivityManager
    get() =
        reactApplicationContext.getSystemService(Context.CONNECTIVITY_SERVICE)
            as ConnectivityManager

  private val networkCallback =
      object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) = emitOnline()

        override fun onLost(network: Network) = emitOnline()

        override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) =
            emitOnline()
      }

  override fun initialize() {
    super.initialize()
    MiraNotificationListener.onCaptured = {
      if (reactApplicationContext.hasActiveReactInstance()) {
        reactApplicationContext.emitDeviceEvent(EVENT_NOTIFICATION)
      }
    }
    connectivity.registerDefaultNetworkCallback(networkCallback)
  }

  override fun invalidate() {
    MiraNotificationListener.onCaptured = null
    try {
      connectivity.unregisterNetworkCallback(networkCallback)
    } catch (e: IllegalArgumentException) {
      // Never registered.
    }
    super.invalidate()
  }

  private fun currentlyOnline(): Boolean {
    val network = connectivity.activeNetwork ?: return false
    val capabilities = connectivity.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
        capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
  }

  private fun emitOnline() {
    if (reactApplicationContext.hasActiveReactInstance()) {
      reactApplicationContext.emitDeviceEvent(EVENT_ONLINE, currentlyOnline())
    }
  }

  @ReactMethod
  fun setEnabledPackages(packageNames: ReadableArray, promise: Promise) {
    val packages = HashSet<String>()
    for (i in 0 until packageNames.size()) packageNames.getString(i)?.let { packages.add(it) }
    EnabledPackages.set(reactApplicationContext, packages)
    promise.resolve(null)
  }

  /** Installed apps the user could switch on: everything with a launcher icon, except MIRA. */
  @ReactMethod
  fun listNotifyingApps(promise: Promise) {
    val context = reactApplicationContext
    val manager = context.packageManager
    val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val seen = HashSet<String>()
    val list = Arguments.createArray()
    for (info in manager.queryIntentActivities(launcher, 0)) {
      val packageName = info.activityInfo.packageName
      if (packageName == context.packageName || !seen.add(packageName)) continue
      val app = Arguments.createMap()
      app.putString("packageName", packageName)
      app.putString("label", info.loadLabel(manager).toString())
      list.pushMap(app)
    }
    promise.resolve(list)
  }

  /** Captured notifications not yet handed over, as a JSON array. Each is returned once. */
  @ReactMethod
  fun drainInbox(promise: Promise) {
    promise.resolve(NativeInbox.get(reactApplicationContext).drain())
  }

  @ReactMethod
  fun isOnline(promise: Promise) {
    promise.resolve(currentlyOnline())
  }

  @ReactMethod
  fun scheduleReminder(title: String, at: Double, promise: Promise) {
    promise.reject("not_built", "Reminders arrive with task A3.2.")
  }

  /** The model file's path, or null when it has not been copied to the phone. */
  @ReactMethod
  fun getModelPath(promise: Promise) {
    val file = File(reactApplicationContext.getExternalFilesDir(null), MODEL_FILE)
    promise.resolve(if (file.isFile) file.absolutePath else null)
  }

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

  /** Probe only: the latest captured notifications, newest first. */
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

  companion object {
    const val EVENT_NOTIFICATION = "MiraNotification"
    const val EVENT_ONLINE = "MiraOnline"
    const val MODEL_FILE = "model.gguf"
  }
}
