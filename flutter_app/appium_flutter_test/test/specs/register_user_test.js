import { remote } from "webdriverio";
import { byValueKey } from "appium-flutter-finder";
import { strict as assert } from "assert";

// === Helper Methods (same as login_test.js) ===
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

async function tapFlutterElement(driver, key, label) {
  console.log(`👆 Tapping ${label}...`);
  await driver.executeScript("flutter:waitFor", [byValueKey(key)]);
  await driver.pause(200);
  await driver.executeScript("flutter:clickElement", [byValueKey(key)]);
  console.log(`✅ Clicked ${label}`);
}

// === MAIN TEST ===
describe("Flutter User Registration Flow", function () {
  this.timeout(240000); // 4 minutes total
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
      "appium:flutterSystemPort": 4725,
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
    console.log("🚀 Starting Appium session for registration test...");
    driver = await remote(opts);
    await driver.pause(4000);
  });

  after(async () => {
    console.log("🚫 Skipping Appium session cleanup (manual Appium mode).");
  });

  // === TEST 1: REGISTER NEW USER ===
  it("Should navigate to Register screen -> fill fields -> enter OTP manually -> confirm -> redirect to Login", async () => {
    try {
      console.log("⏳ Waiting for Login Screen...");
      await driver.executeScript("flutter:waitFor", [byValueKey("email_field")]);
      console.log("🏠 Login screen detected.");

      // === Step 1: Tap Register button ===
      await tapFlutterElement(driver, "register_button", "Register Button");
      console.log("🔄 Navigating to Register Screen...");
      await driver.executeScript("flutter:waitFor", [byValueKey("register_email_field")]);
      console.log("✅ Register screen loaded successfully.");

      // === Step 2: Fill Registration Details ===
      await enterFlutterText(driver, "register_email_field", "tharakadilshan506+test1@gmail.com", "Email Field");
      await enterFlutterText(driver, "register_password_field", "Tharaka@1234", "Password Field");
      await enterFlutterText(driver, "register_username_field", "TharakaOfficial", "Preferred Username");

      // === Step 3: Tap Register ===
      await tapFlutterElement(driver, "register_action_button", "Register Button");
      console.log("✅ Registration submitted. Waiting for OTP field...");

      // === Step 4: Wait for OTP Field to Appear ===
      await driver.executeScript("flutter:waitFor", [byValueKey("register_code_field")]);
      console.log("📩 OTP input field visible. Please enter the OTP manually now...");

      // Pause for manual OTP entry
      await driver.pause(30000); // 30 seconds to enter OTP manually

      // === Step 5: Tap Confirm (same button key reused) ===
      await tapFlutterElement(driver, "register_action_button", "Confirm Button");
      console.log("✅ Confirmation submitted. Waiting for redirection...");

      // === Step 6: Wait for Login Screen to Reappear ===
      await driver.executeScript("flutter:waitFor", [byValueKey("email_field")]);
      console.log("🎉 Successfully redirected back to Login Screen.");

    } catch (err) {
      console.error("❌ Registration flow test failed:", err.message);
      throw err;
    }
  });
});
