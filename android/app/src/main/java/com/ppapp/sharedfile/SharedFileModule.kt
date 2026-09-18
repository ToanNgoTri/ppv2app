package com.ppapp.sharedfile

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import androidx.core.content.FileProvider
import com.facebook.fbreact.specs.NativeSharedFileSpec
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import java.io.File
import java.text.Normalizer
import java.util.concurrent.Executors

/**
 * Nhận tệp do ứng dụng khác gửi sang (Zalo: "Chia sẻ" hoặc "Mở bằng") và nhờ hệ
 * điều hành mở tệp văn bản.
 *
 * Ba việc phải làm mà gọi Intent trần không có:
 *
 * 1. Zalo đưa sang một `content://` tạm, chỉ đọc được trong lúc quyền URI còn
 *    hiệu lực. Vì vậy tệp được chép ngay vào cache của app rồi mới trả đường dẫn
 *    thật cho JS — trả thẳng `content://` thì lát sau đọc lại là mất quyền.
 * 2. MainActivity chạy `singleTask`, nên lần chia sẻ thứ hai trở đi không tạo
 *    Activity mới mà rơi vào `onNewIntent`. Mỗi intent được đánh dấu đã nhận
 *    (`EXTRA_CONSUMED`) để mở lại app không hiện lại tệp cũ thêm lần nữa.
 * 3. Android 7 trở lên cấm bắn `file://` sang app khác (FileUriExposedException),
 *    nên lúc mở tệp phải bọc qua FileProvider và cấp quyền đọc tạm thời.
 */
@ReactModule(name = SharedFileModule.NAME)
class SharedFileModule(reactContext: ReactApplicationContext) :
  NativeSharedFileSpec(reactContext), ActivityEventListener {

  /** Chép tệp có thể mất vài trăm ms với ảnh lớn — không làm trên luồng UI. */
  private val io = Executors.newSingleThreadExecutor()

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(this)
    io.shutdown()
    super.invalidate()
  }

  // ===== Nhận tệp =====

  override fun takePendingFile(promise: Promise) {
    val intent = reactApplicationContext.currentActivity?.intent
    if (intent == null || !hasUnconsumedFile(intent)) {
      promise.resolve(null)
      return
    }
    intent.putExtra(EXTRA_CONSUMED, true)
    val uri = fileUriOf(intent)
    if (uri == null) {
      promise.resolve(null)
      return
    }
    val type = intent.type
    io.execute {
      try {
        promise.resolve(copyToCache(uri, type))
      } catch (e: Exception) {
        promise.reject("READ_FAILED", e.message ?: "Không đọc được tệp chia sẻ", e)
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
    if (!hasUnconsumedFile(intent)) {
      return
    }
    // Chỉ ghi nhận là intent hiện hành rồi báo cho JS; việc chép tệp để
    // `takePendingFile` làm, tránh hai đường dẫn cùng xử lý một tệp.
    reactApplicationContext.currentActivity?.intent = intent
    emitOnFileShared()
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) = Unit

  // ===== Mở tệp bằng ứng dụng khác =====

  override fun openWithSystemViewer(path: String, mimeType: String, promise: Promise) {
    val file = File(path)
    if (!file.exists()) {
      promise.reject("NOT_FOUND", "Tệp không còn trên máy")
      return
    }
    val context = reactApplicationContext
    val uri =
      try {
        FileProvider.getUriForFile(context, context.packageName + ".sharedfile", file)
      } catch (e: IllegalArgumentException) {
        promise.reject("NOT_SHAREABLE", "Không chia sẻ được tệp này", e)
        return
      }

    val intent =
      Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, if (mimeType.isBlank()) "*/*" else mimeType)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
    val activity = reactApplicationContext.currentActivity
    try {
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
      promise.resolve(null)
    } catch (e: ActivityNotFoundException) {
      promise.reject("NO_APP", "Máy chưa có ứng dụng mở được tệp này", e)
    }
  }

  // ===== Phần dùng chung =====

  private fun hasUnconsumedFile(intent: Intent): Boolean =
    !intent.getBooleanExtra(EXTRA_CONSUMED, false) && fileUriOf(intent) != null

  /**
   * Tệp đính trong intent, bất kể app gửi dùng kiểu nào: "Chia sẻ" gửi
   * ACTION_SEND kèm EXTRA_STREAM, còn "Mở bằng" gửi ACTION_VIEW với URI nằm ở
   * `data`.
   */
  @Suppress("DEPRECATION")
  private fun fileUriOf(intent: Intent): Uri? =
    when (intent.action) {
      Intent.ACTION_SEND ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
          intent.getParcelableExtra(Intent.EXTRA_STREAM)
        }
      // Gửi nhiều tệp một lúc thì chỉ lấy tệp đầu: lịch trực chỉ giữ một bản.
      Intent.ACTION_SEND_MULTIPLE ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)?.firstOrNull()
        } else {
          intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.firstOrNull()
        }
      Intent.ACTION_VIEW -> intent.data
      else -> null
    }

  /**
   * Chép tệp vào `cache/shared-in/`. Thư mục được dọn sạch trước mỗi lần chép để
   * không tích tệp rác — bản giữ lại nằm ở thư mục riêng do phía JS quản lý.
   */
  private fun copyToCache(uri: Uri, fallbackMime: String?): WritableMap {
    val resolver = reactApplicationContext.contentResolver
    var name = ""
    var size = 0L
    resolver.query(uri, null, null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (nameIndex >= 0 && !cursor.isNull(nameIndex)) {
          name = cursor.getString(nameIndex)
        }
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) {
          size = cursor.getLong(sizeIndex)
        }
      }
    }
    if (name.isBlank()) {
      name = uri.lastPathSegment ?: "lich-truc"
    }
    val mimeType = resolver.getType(uri) ?: fallbackMime.orEmpty()

    val dir = File(reactApplicationContext.cacheDir, "shared-in")
    dir.listFiles()?.forEach { it.delete() }
    dir.mkdirs()
    val target = File(dir, safeFileName(name))
    val input = resolver.openInputStream(uri) ?: throw IllegalStateException("Không mở được tệp chia sẻ")
    input.use { source ->
      target.outputStream().use { output -> source.copyTo(output) }
    }

    return Arguments.createMap().apply {
      putString("path", target.absolutePath)
      putString("name", name)
      putString("mimeType", mimeType)
      putDouble("size", (if (size > 0) size else target.length()).toDouble())
    }
  }

  /** Bỏ dấu tiếng Việt và ký tự lạ để tên tệp an toàn trên mọi hệ tệp. */
  private fun safeFileName(name: String): String {
    val cleaned =
      Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
        .replace(Regex("\\p{M}+"), "")
        .replace("đ", "d")
        .replace("Đ", "D")
        .replace(Regex("[^A-Za-z0-9._-]+"), "-")
        .trim('-')
    return if (cleaned.isBlank()) "lich-truc" else cleaned.takeLast(80)
  }

  companion object {
    const val NAME = "SharedFile"

    /** Đánh dấu intent đã được đọc, tránh nhận lại cùng một tệp nhiều lần. */
    private const val EXTRA_CONSUMED = "com.ppapp.sharedfile.CONSUMED"
  }
}
