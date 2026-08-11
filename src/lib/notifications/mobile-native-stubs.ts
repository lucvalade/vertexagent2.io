/**
 * Reserved Native Mobile App Push Notification Handler Code
 * 
 * This file contains the verified native code blocks for Android (Kotlin / FCM)
 * and iOS (Swift / APNs) push notification services. 
 * These stubs are reserved for deployment when the native iOS and Android
 * apps are compiled and launched.
 */

export const NATIVE_MOBILE_NOTIFICATION_STUBS = {
  /**
   * Android (Kotlin / Firebase Cloud Messaging) Service
   */
  androidKotlinService: `
// Android Service to receive FCM notifications
// Location: app/src/main/java/com/aiopenhouse/connect/MyFirebaseMessagingService.kt

package com.aiopenhouse.connect

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Get the text from the cloud packet
        val title = remoteMessage.notification?.title ?: "Support Ticket Update"
        val body = remoteMessage.notification?.body ?: "New reply on your ticket."
        val ticketId = remoteMessage.data["ticketId"]
        
        // Build the visual alert on the phone
        val builder = NotificationCompat.Builder(this, "SUPPORT_TICKETS_CHANNEL")
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            
        NotificationManagerCompat.from(this).notify(101, builder.build())
    }
}
`,

  /**
   * iOS (Swift / Apple Push Notification service) Delegate
   */
  iOSSwiftDelegate: `
// iOS App Delegate to handle incoming APNs data
// Location: ios/Runner/AppDelegate.swift or ios/AIOpenHouseConnect/AppDelegate.swift

import UIKit
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                                willPresent notification: UNNotification, 
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        
        // Read message content
        let userInfo = notification.request.content.userInfo
        print("Notification Data received: \(userInfo)")
        
        // Show the alert banner on screen while app is open
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound])
        }
    }
}
`,

  /**
   * Universal Mobile Payload Spec
   */
  payloadSpec: {
    title: "AI Open House Connect Support",
    body: "New reply from Support on Ticket #TK-1001",
    data: {
      ticketId: "TK-1001",
      channel: "SUPPORT_REPLY",
      clickAction: "FLUTTER_NOTIFICATION_CLICK"
    }
  }
};
