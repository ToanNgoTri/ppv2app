package com.ppapp

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ppapp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Bắt buộc theo hướng dẫn của react-native-screens.
   *
   * Khi lâu không mở app, Android sẽ kill process để lấy lại RAM nhưng vẫn giữ
   * savedInstanceState của Activity. Lúc mở lại, FragmentManager khôi phục các
   * fragment cũ của react-native-screens trong khi cây JS chưa tồn tại -> crash
   * native ngay lúc khởi động. RNScreensFragmentFactory xử lý việc khôi phục này
   * an toàn (gỡ bỏ các fragment mồ côi thay vì dựng lại sai).
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
  }
}
