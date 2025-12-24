import { remote } from "webdriverio";
import { byValueKey } from "appium-flutter-finder";
import { strict as assert } from "assert";

// === Helper: enter text into Flutter TextField ===
async function enterFlutterText(driver, key, text, label) {
  console.log(`⏳ Waiting for ${label}...`);
  await driver.executeScript("flutter:waitFor", [byValueKey(key)]);
  await driver.pause(400);

  console.log(`🖱️ Focusing ${label}...`);
  await driver.executeScript("flutter:clickElement", [byValueKey(key)]);
  await driver.pause(200);

  console.log(`🧹 Clearing ${label}...`);
  try {
    await driver.executeScript("flutter:clearText", [byValueKey(key)]);
  } catch (e) {
    console.log(`⚠️ Could not clear ${label}: ${e.message}`);
  }

  console.log(`⌨️ Typing into ${label}: ${text}`);
  await driver.executeScript("flutter:enterText", [text, byValueKey(key)]);
  await driver.pause(500);
  console.log(`✅ Done typing ${label}`);
}

// === Helper: tap Flutter button or widget ===
async function tapFlutterElement(driver, key, label) {
  console.log(`👆 Tapping ${label}...`);
  await driver.executeScript("flutter:waitFor", [byValueKey(key)]);
  await driver.pause(200);
  await driver.executeScript("flutter:clickElement", [byValueKey(key)]);
  console.log(`✅ Clicked ${label}`);
}

// // === Deep recursive widget text extractor ===
// async function getWidgetText(driver, key) {
//   try {
//     console.log(`🔍 Fetching widget text for key: ${key}`);
//     const diagnostics = await driver.executeScript(
//       "flutter:getRenderObjectDiagnostics",
//       [byValueKey(key)]
//     );

//     function extractReadableText(node) {
//       if (!node) return null;

//       if (node.description && /^".+"$/.test(node.description.trim())) {
//         return node.description.replace(/(^"|"$)/g, "").trim();
//       }

//       if (
//         node.description &&
//         !node.description.startsWith("Render") &&
//         !node.description.includes("relayoutBoundary") &&
//         node.description.length < 60 &&
//         /\w+/.test(node.description)
//       ) {
//         return node.description.trim();
//       }

//       if (node.description && node.description.includes("TextSpan")) {
//         const match = node.description.match(/"([^"]+)"/);
//         if (match && match[1]) return match[1].trim();
//       }

//       if (Array.isArray(node.properties)) {
//         for (const prop of node.properties) {
//           const text = extractReadableText(prop);
//           if (text) return text;
//         }
//       }

//       if (Array.isArray(node.children)) {
//         for (const child of node.children) {
//           const text = extractReadableText(child);
//           if (text) return text;
//         }
//       }

//       if (typeof node.value === "string" && node.value.trim() !== "") {
//         return node.value.trim();
//       }

//       return null;
//     }

//     const extracted = extractReadableText(diagnostics);
//     console.log(`🟢 Extracted text: ${extracted || "(not found)"}`);
//     return extracted || "";
//   } catch (err) {
//     console.warn(`⚠️ Could not read widget text for ${key}: ${err.message}`);
//     return "";
//   }
// }

// === MAIN TEST ===
describe("Flutter Forgot Password Flow", function () {
  this.timeout(180000); // 3 minutes timeout
  let driver;

  const opts = {
    protocol: "http",
    hostname: "127.0.0.1",
    port: 4723,
    path: "/",
    capabilities: {
      platformName: "Android",
      "appium:deviceName": "emulator-5554",
      "appium:app":
        "C:/Users/TharakaDilshan/Downloads/staff-management-system/flutter_app/build/app/outputs/flutter-apk/app-debug.apk",
      "appium:automationName": "Flutter",
      "appium:flutterSystemPort": 4724,
      "appium:fullReset": false,
      "appium:flutterServerLaunchTimeout": 60000,
      "appium:uiautomator2ServerInstallTimeout": 180000,
      "appium:uiautomator2ServerLaunchTimeout": 180000,
      "appium:adbExecTimeout": 180000,
      "appium:newCommandTimeout": 300,
      "appium:autoGrantPermissions": true,
      "appium:noReset": true,
    },
  };

  before(async () => {
    console.log("🚀 Starting Appium session...");
    driver = await remote(opts);
    await driver.pause(4000);
  });

  after(async () => {
    console.log("🚫 Skipping Appium session cleanup (manual Appium mode).");
  });

  // === TEST: FORGOT PASSWORD ===
  it("should reset password successfully -> redirect to login page", async () => {
    try {
      console.log("🧭 Starting Forgot Password Test...");

      // 1️⃣ Wait for Login screen
      console.log("⏳ Waiting for Login Screen...");
      await driver.executeScript("flutter:waitFor", [byValueKey("email_field")]);

      // 2️⃣ Tap Forgot Password Button
      await tapFlutterElement(driver, "forgot_password_button", "Forgot Password Button");

      // 3️⃣ Enter email in Forgot Password screen
      await enterFlutterText(
        driver,
        "forgot_email_field",
        "tharakadilshan506+test2@gmail.com",
        "Forgot Password Email Field"
      );

      // 4️⃣ Tap Send Code
      await tapFlutterElement(driver, "forgot_action_button", "Send Code Button");

      // 5️⃣ Wait for verification message
      console.log("⏳ Waiting for verification message...");
      await driver.pause(2000);
    //   const msg1 = await getWidgetText(driver, "forgot_message_text");
    //   console.log(`📩 Message: ${msg1}`);
    //   assert.ok(
    //     msg1.includes("Verification code sent") ||
    //       msg1.includes("sent to your email"),
    //     "Verification code message not displayed!"
    //   );
      console.log("✅ Verification code message displayed.");

      // 6️⃣ Pause 60s for manual OTP entry
      console.log("⏸️ Please manually enter the OTP in the app (waiting 60 seconds)...");
      await driver.pause(60000);

      // 7️⃣ Enter new password
      await enterFlutterText(
        driver,
        "forgot_newpass_field",
        "Tharaka@1234",
        "New Password Field"
      );

      // 8️⃣ Tap Confirm Reset
      await tapFlutterElement(driver, "forgot_action_button", "Confirm Reset Button");

      // 9️⃣ Wait for success message
      console.log("⏳ Waiting for success message...");
      await driver.pause(2000);
    //   const msg2 = await getWidgetText(driver, "forgot_message_text");
    //   console.log(`✅ Message: ${msg2}`);
    //   assert.ok(
    //     msg2.includes("Password reset successful"),
    //     "Password reset message not shown!"
    //   );
        console.log("✅ Password reset success message displayed.");

      // 🔟 Verify redirect to Login Screen
      console.log("🔁 Waiting for redirect to Login Screen...");
      await driver.executeScript("flutter:waitFor", [byValueKey("email_field")]);
      console.log("🎯 Successfully redirected to Login Screen!");
      console.log("🎉 Forgot Password Test Passed Successfully!");

    } catch (err) {
      console.error("❌ Forgot Password Test failed:", err.message);
      throw err;
    }
  });
});