package com.mira.app

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.TrafficStats
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.provider.OpenableColumns
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.mira.app.notifications.EnabledPackages
import com.mira.app.notifications.MiraNotificationListener
import com.mira.app.notifications.NativeInbox
import com.mira.app.reminders.ReminderReceiver
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

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

  /** The JavaScript call waiting for the user to pick a model file. */
  private var pendingImport: Promise? = null

  private val activityListener =
      object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?,
        ) {
          if (requestCode != REQUEST_MODEL_FILE) return
          val promise = pendingImport ?: return
          pendingImport = null
          val uri = data?.data
          if (resultCode != Activity.RESULT_OK || uri == null) {
            promise.resolve("cancelled")
            return
          }
          // A 1 GB copy must not hold up the UI thread.
          Thread { copyModel(uri, promise) }.start()
        }
      }

  init {
    context.addActivityEventListener(activityListener)
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
    reactApplicationContext.removeActivityEventListener(activityListener)
    MiraNotificationListener.onCaptured = null
    mainHandler.removeCallbacksAndMessages(null)
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

  private val mainHandler = Handler(Looper.getMainLooper())
  private var lastOnline: Boolean? = null

  /**
   * Android reports a lost network before it stops being the active one, so the state is read a
   * moment later. JavaScript is told only when the answer changes.
   */
  private fun emitOnline() {
    mainHandler.removeCallbacksAndMessages(null)
    mainHandler.postDelayed(
        {
          val online = currentlyOnline()
          if (online != lastOnline && reactApplicationContext.hasActiveReactInstance()) {
            lastOnline = online
            reactApplicationContext.emitDeviceEvent(EVENT_ONLINE, online)
          }
        },
        ONLINE_SETTLE_MS,
    )
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

  /** Posts a local notification at the given time (epoch milliseconds). */
  @ReactMethod
  fun scheduleReminder(title: String, at: Double, promise: Promise) {
    ReminderReceiver.schedule(reactApplicationContext, title, at.toLong())
    promise.resolve(null)
  }

  @ReactMethod
  fun cancelReminder(title: String, at: Double, promise: Promise) {
    ReminderReceiver.cancel(reactApplicationContext, title, at.toLong())
    promise.resolve(null)
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

  /**
   * Opens Android's file picker for a model file the user already has on the
   * phone (downloaded in their browser, or copied over USB) and copies it into
   * MIRA's own folder. MIRA itself never goes online. Resolves "imported" or
   * "cancelled"; progress arrives as MiraModelImport events.
   */
  @ReactMethod
  fun importModel(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("no_activity", "MIRA is not on screen.")
      return
    }
    if (pendingImport != null) {
      promise.reject("busy", "A file is already being chosen.")
      return
    }
    pendingImport = promise
    val intent =
        Intent(Intent.ACTION_OPEN_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            // .gguf has no registered type, so every file is offered and the content is checked.
            .setType("*/*")
    try {
      activity.startActivityForResult(intent, REQUEST_MODEL_FILE)
    } catch (e: Exception) {
      pendingImport = null
      promise.reject("no_picker", "This phone has no file picker.")
    }
  }

  private fun copyModel(uri: Uri, promise: Promise) {
    val context = reactApplicationContext
    val dir = context.getExternalFilesDir(null)
    if (dir == null) {
      promise.reject("no_storage", "Phone storage is not available.")
      return
    }
    val resolver = context.contentResolver
    val total =
        resolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)?.use {
          if (it.moveToFirst() && !it.isNull(0)) it.getLong(0) else -1L
        } ?: -1L
    if (total > 0 && dir.usableSpace < total + SPACE_MARGIN) {
      promise.reject("no_space", "Not enough free space on this phone.")
      return
    }
    val part = File(dir, "$MODEL_FILE.part")
    try {
      val raw = resolver.openInputStream(uri)
      if (raw == null) {
        promise.reject("unreadable", "That file could not be opened.")
        return
      }
      BufferedInputStream(raw).use { input ->
        // Every GGUF file starts with these four bytes; anything else is not a model.
        input.mark(GGUF_MAGIC.size)
        val head = ByteArray(GGUF_MAGIC.size)
        var got = 0
        while (got < head.size) {
          val n = input.read(head, got, head.size - got)
          if (n < 0) break
          got += n
        }
        if (got < head.size || !head.contentEquals(GGUF_MAGIC)) {
          promise.reject("not_model", "That file is not a model file (.gguf).")
          return
        }
        input.reset()
        part.outputStream().use { out ->
          val buffer = ByteArray(1 shl 20)
          var copied = 0L
          var reported = 0L
          while (true) {
            val n = input.read(buffer)
            if (n < 0) break
            out.write(buffer, 0, n)
            copied += n
            if (copied - reported >= PROGRESS_STEP) {
              reported = copied
              emitImportProgress(copied, total)
            }
          }
          emitImportProgress(copied, if (total > 0) total else copied)
        }
      }
      installModel(part, dir)
      promise.resolve("imported")
    } catch (e: Exception) {
      part.delete()
      promise.reject("copy_failed", "The file could not be copied. Try again.")
    }
  }

  private fun emitImportProgress(copied: Long, total: Long) {
    if (!reactApplicationContext.hasActiveReactInstance()) return
    val progress = Arguments.createMap()
    progress.putDouble("copied", copied.toDouble())
    progress.putDouble("total", total.toDouble())
    reactApplicationContext.emitDeviceEvent(EVENT_MODEL_IMPORT, progress)
  }

  @Volatile private var downloadCancelled = false
  @Volatile private var downloading = false

  /**
   * Downloads MIRA's file from `url` into MIRA's own folder, resuming a part
   * left by an earlier try. This is the only thing the internet permission is
   * used for. When `sha256` is given the file must match it. Resolves
   * "downloaded" or "cancelled"; progress arrives as MiraModelImport events.
   */
  @ReactMethod
  fun downloadModel(url: String, sha256: String?, promise: Promise) {
    if (downloading) {
      promise.reject("busy", "MIRA's file is already downloading.")
      return
    }
    downloading = true
    downloadCancelled = false
    Thread {
      try {
        fetchModel(url, sha256?.lowercase(), promise)
      } finally {
        downloading = false
      }
    }.start()
  }

  @ReactMethod
  fun cancelModelDownload(promise: Promise) {
    downloadCancelled = true
    promise.resolve(null)
  }

  /** Bytes already downloaded by an unfinished try, so the screen can offer to resume. */
  @ReactMethod
  fun getPartialDownloadBytes(promise: Promise) {
    val part = File(reactApplicationContext.getExternalFilesDir(null), DOWNLOAD_PART)
    promise.resolve(if (part.isFile) part.length().toDouble() else 0.0)
  }

  private fun fetchModel(url: String, sha256: String?, promise: Promise) {
    val dir = reactApplicationContext.getExternalFilesDir(null)
    if (dir == null) {
      promise.reject("no_storage", "Phone storage is not available.")
      return
    }
    val part = File(dir, DOWNLOAD_PART)
    var have = if (part.isFile) part.length() else 0L
    var connection: HttpURLConnection? = null
    try {
      connection = (URL(url).openConnection() as HttpURLConnection).apply {
        connectTimeout = 15_000
        readTimeout = 30_000
        instanceFollowRedirects = true
        if (have > 0) setRequestProperty("Range", "bytes=$have-")
      }
      val code = connection.responseCode
      val append = code == HttpURLConnection.HTTP_PARTIAL && have > 0
      if (code == 416 && have > 0) {
        // The part is already whole; check and install it below.
      } else if (code != HttpURLConnection.HTTP_OK && !append) {
        promise.reject("http_$code", "The download server answered $code.")
        return
      }
      if (!append && code != 416) have = 0L
      val total = if (code == 416) have else have + connection.contentLengthLong.coerceAtLeast(0L)
      if (total > have && dir.usableSpace < (total - have) + SPACE_MARGIN) {
        promise.reject("no_space", "Not enough free space on this phone.")
        return
      }

      val digest = MessageDigest.getInstance("SHA-256")
      if (have > 0) {
        part.inputStream().use { input ->
          val buffer = ByteArray(1 shl 20)
          while (true) {
            val n = input.read(buffer)
            if (n < 0) break
            digest.update(buffer, 0, n)
          }
        }
      }
      if (code != 416) {
        connection.inputStream.use { input ->
          FileOutputStream(part, append).use { out ->
            val buffer = ByteArray(1 shl 16)
            var copied = have
            var reported = have
            while (true) {
              if (downloadCancelled) {
                promise.resolve("cancelled")
                return
              }
              val n = input.read(buffer)
              if (n < 0) break
              out.write(buffer, 0, n)
              digest.update(buffer, 0, n)
              copied += n
              if (copied - reported >= PROGRESS_STEP) {
                reported = copied
                emitImportProgress(copied, total)
              }
            }
            emitImportProgress(copied, if (total > 0) total else copied)
          }
        }
      }

      if (sha256 != null) {
        val got = digest.digest().joinToString("") { "%02x".format(it) }
        if (got != sha256) {
          part.delete()
          promise.reject("corrupt", "The downloaded file was damaged.")
          return
        }
      }
      if (!startsWithGguf(part)) {
        part.delete()
        promise.reject("not_model", "The download is not a model file.")
        return
      }
      installModel(part, dir)
      promise.resolve("downloaded")
    } catch (e: IOException) {
      // The part stays, so the next try resumes where this one stopped.
      promise.reject("no_connection", "The download stopped. Check the connection and try again.")
    } catch (e: Exception) {
      promise.reject("download_failed", "The download failed. Try again.")
    } finally {
      connection?.disconnect()
    }
  }

  private fun startsWithGguf(file: File): Boolean {
    val head = ByteArray(GGUF_MAGIC.size)
    val got = file.inputStream().use { it.read(head) }
    return got == head.size && head.contentEquals(GGUF_MAGIC)
  }

  /** Puts a finished file in place of the model, replacing any old one. */
  private fun installModel(part: File, dir: File) {
    val target = File(dir, MODEL_FILE)
    if (target.exists() && !target.delete()) throw IllegalStateException("old model in use")
    if (!part.renameTo(target)) throw IllegalStateException("rename failed")
  }

  /** Where the model file is copied to over USB. Readable by the app with no permission. */
  @ReactMethod
  fun getModelDir(promise: Promise) {
    promise.resolve(reactApplicationContext.getExternalFilesDir(null)?.absolutePath)
  }

  companion object {
    const val EVENT_NOTIFICATION = "MiraNotification"
    const val EVENT_ONLINE = "MiraOnline"
    const val EVENT_MODEL_IMPORT = "MiraModelImport"
    const val MODEL_FILE = "model.gguf"
    /** Kept apart from the import's part file, so one cannot delete the other's. */
    private const val DOWNLOAD_PART = "model.gguf.download"
    private const val REQUEST_MODEL_FILE = 4711
    private val GGUF_MAGIC = byteArrayOf(0x47, 0x47, 0x55, 0x46) // "GGUF"
    /** Room left over after the copy, so the phone is not filled to the last byte. */
    private const val SPACE_MARGIN = 200L * 1024 * 1024
    private const val PROGRESS_STEP = 8L * 1024 * 1024
    private const val ONLINE_SETTLE_MS = 500L
  }
}
