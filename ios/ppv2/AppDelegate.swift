import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UniformTypeIdentifiers

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "ppv2",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  /**
   Nhận tệp lịch trực do ứng dụng khác gửi sang ("Mở bằng ứng dụng khác" trong
   Zalo).

   Tệp phải được chép NGAY tại đây: URL do hệ thống đưa vào chỉ đọc được trong
   phạm vi hàm này (tệp trong Inbox có thể bị dọn, tệp mở tại chỗ cần quyền
   security-scoped). Thông tin tệp ghi vào UserDefaults chứ không gọi thẳng vào
   module native, vì lúc mở nguội thì JS — và cả module — chưa tồn tại.

   Khoá và tên thông báo dưới đây phải khớp với ios/ppv2/SharedFile.mm.
   */
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    guard url.isFileURL else {
      return false
    }
    let scoped = url.startAccessingSecurityScopedResource()
    defer {
      if scoped {
        url.stopAccessingSecurityScopedResource()
      }
    }

    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let dir = caches.appendingPathComponent("shared-in", isDirectory: true)
    // Dọn sạch trước mỗi lần nhận để không tích tệp rác; bản giữ lại nằm ở thư
    // mục riêng do phía JS quản lý.
    try? FileManager.default.removeItem(at: dir)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

    let name = url.lastPathComponent.isEmpty ? "lich-truc" : url.lastPathComponent
    let target = dir.appendingPathComponent(safeFileName(name))
    do {
      try FileManager.default.copyItem(at: url, to: target)
    } catch {
      return false
    }

    let attributes = try? FileManager.default.attributesOfItem(atPath: target.path)
    let size = (attributes?[.size] as? NSNumber)?.intValue ?? 0
    let mimeType = UTType(filenameExtension: url.pathExtension)?.preferredMIMEType ?? ""

    UserDefaults.standard.set(
      [
        "path": target.path,
        "name": name,
        "mimeType": mimeType,
        "size": size,
      ],
      forKey: "PPPendingSharedFile"
    )
    NotificationCenter.default.post(name: Notification.Name("PPSharedFileReceived"), object: nil)
    return true
  }

  /// Bỏ dấu tiếng Việt và ký tự lạ để tên tệp an toàn trên mọi hệ tệp.
  private func safeFileName(_ name: String) -> String {
    let folded = name.folding(options: .diacriticInsensitive, locale: Locale(identifier: "en_US"))
    let cleaned = folded
      .replacingOccurrences(of: "[^A-Za-z0-9._-]+", with: "-", options: .regularExpression)
      .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    if cleaned.isEmpty {
      return "lich-truc"
    }
    return String(cleaned.suffix(80))
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
