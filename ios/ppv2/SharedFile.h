#import <AppSpecs/AppSpecs.h>

NS_ASSUME_NONNULL_BEGIN

/** Tên thông báo AppDelegate bắn ra khi nhận được tệp từ ứng dụng khác. */
extern NSString *const PPSharedFileReceivedNotification;
/** Khoá NSUserDefaults giữ tệp đang chờ JS lấy. */
extern NSString *const PPSharedFilePendingKey;

/**
 * Nhận tệp do ứng dụng khác gửi sang (Zalo: "Mở bằng ứng dụng khác" / "Copy to
 * ppv2") và mở tệp văn bản bằng trình xem của hệ điều hành.
 *
 * iOS đưa tệp vào qua AppDelegate chứ không qua module, và ở lần mở nguội thì
 * AppDelegate chạy trước cả khi JS tồn tại. Nên AppDelegate chép tệp ra
 * Caches/shared-in rồi ghi thông tin vào NSUserDefaults; module chỉ việc lấy ra
 * (và xoá đi) khi JS hỏi — cùng một đường dẫn cho cả mở nguội lẫn đang chạy.
 */
@interface SharedFile : NativeSharedFileSpecBase <NativeSharedFileSpec>
@end

NS_ASSUME_NONNULL_END
