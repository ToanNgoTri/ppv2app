#import "SharedFile.h"

#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>

NSString *const PPSharedFileReceivedNotification = @"PPSharedFileReceived";
NSString *const PPSharedFilePendingKey = @"PPPendingSharedFile";

@interface SharedFile () <UIDocumentInteractionControllerDelegate>
/** Giữ tham chiếu mạnh: UIDocumentInteractionController tự giải phóng thì bảng
    xem trước biến mất ngay khi vừa hiện. */
@property(nonatomic, strong, nullable) UIDocumentInteractionController *previewer;
@end

@implementation SharedFile

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(fileReceived:)
                                                 name:PPSharedFileReceivedNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)fileReceived:(NSNotification *)notification {
  [self emitOnFileShared];
}

#pragma mark - Spec

- (void)takePendingFile:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *pending = [defaults dictionaryForKey:PPSharedFilePendingKey];
  if (pending == nil) {
    resolve(nil);
    return;
  }
  [defaults removeObjectForKey:PPSharedFilePendingKey];

  NSString *path = pending[@"path"];
  if (path == nil || ![[NSFileManager defaultManager] fileExistsAtPath:path]) {
    resolve(nil);
    return;
  }
  resolve(@{
    @"path" : path,
    @"name" : pending[@"name"] ?: @"lich-truc",
    @"mimeType" : pending[@"mimeType"] ?: @"",
    @"size" : pending[@"size"] ?: @0,
  });
}

- (void)openWithSystemViewer:(NSString *)path
                    mimeType:(NSString *)mimeType
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
  if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
    reject(@"NOT_FOUND", @"Tệp không còn trên máy", nil);
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *presenter = RCTPresentedViewController();
    if (presenter == nil) {
      reject(@"NO_SCREEN", @"Chưa mở được trình xem tệp", nil);
      return;
    }
    self.previewer =
        [UIDocumentInteractionController interactionControllerWithURL:[NSURL fileURLWithPath:path]];
    self.previewer.delegate = self;
    // QuickLook đọc sẵn Word/PDF nên gần như luôn mở được; nếu không thì mở bảng
    // "Mở bằng..." để người dùng chọn ứng dụng khác.
    if ([self.previewer presentPreviewAnimated:YES]) {
      resolve(nil);
      return;
    }
    if ([self.previewer presentOpenInMenuFromRect:presenter.view.bounds
                                           inView:presenter.view
                                         animated:YES]) {
      resolve(nil);
      return;
    }
    self.previewer = nil;
    reject(@"NO_APP", @"Máy chưa có ứng dụng mở được tệp này", nil);
  });
}

#pragma mark - UIDocumentInteractionControllerDelegate

- (UIViewController *)documentInteractionControllerViewControllerForPreview:
    (UIDocumentInteractionController *)controller {
  return RCTPresentedViewController();
}

- (void)documentInteractionControllerDidEndPreview:(UIDocumentInteractionController *)controller {
  self.previewer = nil;
}

@end
