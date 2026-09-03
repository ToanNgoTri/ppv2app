module.exports = {
  dependencies: {
    // react-native-leaflet-view 1.1.2 (2022) dung jcenter() + AGP 3.2.1 nen khong
    // configure duoc voi Gradle 9 / AGP 9 cua RN 0.87. Module native cua no chi
    // chua ham mau `multiply` khong ai goi; thu duy nhat can la assets/leaflet.html
    // -> tat autolink Android, copy leaflet.html vao assets cua app
    //    (file:///android_asset/leaflet.html van tro dung file).
    'react-native-leaflet-view': {
      platforms: {
        android: null,
      },
    },
  },
};
