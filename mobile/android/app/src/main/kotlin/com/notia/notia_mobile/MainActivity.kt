package com.notia.notia_mobile

import io.flutter.embedding.android.FlutterFragmentActivity

// local_auth's biometric prompt (androidx.biometric) requires a
// FragmentActivity to attach to — plain FlutterActivity silently fails or
// crashes the biometric call. This is the actual cause of "fingerprint not
// working" on the Samsung device.
class MainActivity : FlutterFragmentActivity()
