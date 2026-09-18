package com.ppapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.ppapp.sharedfile.SharedFilePackage
import com.ppapp.speech.SpeechRecognizerPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          // Module đọc chính tả sống trong chính app này nên không autolink được.
          add(SpeechRecognizerPackage())
          // Module nhận tệp chia sẻ từ Zalo cũng nằm trong app, phải thêm tay.
          add(SharedFilePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
