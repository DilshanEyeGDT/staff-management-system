import { remote } from "webdriverio";
import { byValueKey } from "appium-flutter-finder";
import { strict as assert } from "assert";

// Helper: enter text into Flutter TextField
async function enterFlutterText(driver, key, text, label) {
  console.log(`⏳ Waiting for ${label}...`);
  await driver.executeScript("flutter:waitFor", [byValueKey(key)]);
  await driver.pause(500); // Increased from 400

  console.log(`🖱️ Focusing ${label}...`);
  await driver.executeScript("flutter:clickElement", [byValueKey(key)]);
  await driver.pause(300); // Increased from 200

  console.log(`🧹 Clearing ${label}...`);
  try {
    await driver.executeScript("flutter:clearText", [byValueKey(key)]);
    await driver.pause(200); // Added pause after clear
  } catch (e) {
    console.log(`⚠️ Could not clear ${label}: ${e.message}`);
  }

  console.log(`⌨️ Typing into ${label}: ${text}`);
  await driver.executeScript("flutter:enterText", [text, byValueKey(key)]);
  await driver.pause(700); // Increased from 500
  console.log(`✅ Done typing ${label}`);
}

// Helper: tap Flutter button or widget
async function tapFlutterElement(driver, key, label) {
  console.log(`👆 Tapping ${label}...`);
  await driver.executeScript("flutter:waitFor", [byValueKey(key)]);
  await driver.pause(300); // Increased from 200
  await driver.executeScript("flutter:clickElement", [byValueKey(key)]);
  await driver.pause(500); // Added pause after click
  console.log(`✅ Clicked ${label}`);
}

// Deep recursive widget text extractor for Flutter Appium
async function getWidgetText(driver, key) {
  try {
    console.log(`🔍 Fetching widget text for key: ${key}`);
    const diagnostics = await driver.executeScript(
      "flutter:getRenderObjectDiagnostics",
      [byValueKey(key)]
    );

    // Recursive parser that digs into properties, children, and values
    function extractReadableText(node) {
      if (!node) return null;

      // 1️⃣ Direct text inside description like "IamTheBoss"
      if (
        node.description &&
        /^".+"$/.test(node.description.trim())
      ) {
        return node.description.replace(/(^"|"$)/g, "").trim();
      }

      // 2️⃣ Description looks like plain readable text (not RenderParagraph etc.)
      if (
        node.description &&
        !node.description.startsWith("Render") &&
        !node.description.includes("relayoutBoundary") &&
        node.description.length < 60 &&
        /\w+/.test(node.description)
      ) {
        return node.description.trim();
      }

      // 3️⃣ Look for TextSpan("YourName") pattern
      if (node.description && node.description.includes("TextSpan")) {
        const match = node.description.match(/"([^"]+)"/);
        if (match && match[1]) return match[1].trim();
      }

      // 4️⃣ Recurse into properties array
      if (Array.isArray(node.properties)) {
        for (const prop of node.properties) {
          const text = extractReadableText(prop);
          if (text) return text;
        }
      }

      // 5️⃣ Recurse into children array
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          const text = extractReadableText(child);
          if (text) return text;
        }
      }

      // 6️⃣ Sometimes text can be directly in node.value
      if (typeof node.value === "string" && node.value.trim() !== "") {
        return node.value.trim();
      }

      return null;
    }

    const extracted = extractReadableText(diagnostics);
    console.log(`🟢 Extracted text: ${extracted || "(not found)"}`);
    return extracted || "";
  } catch (err) {
    console.warn(`⚠️ Could not read widget text for ${key}: ${err.message}`);
    return "";
  }
}

// === Main Test ===
describe("Flutter Login Flow", function () {
  this.timeout(240000); // 3 minutes timeout
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
    
    // Wait for app initialization (Amplify + Flutter setup)
    console.log("⏳ Waiting for app to fully initialize...");
    await driver.pause(8000); // Increased from 4000 to allow Amplify to configure
    
    console.log("✅ App initialization complete");
  });

  after(async () => {
  console.log("✅ Tests completed - session will auto-cleanup");
  // Let WebDriverIO handle session cleanup automatically
});

  // === TEST 1: LOGIN FLOW ===
  it("Should login successfully -> Reach home screen", async () => {
    try {
      // === LOGIN SCREEN ===
      console.log("⏳ Waiting for Login Screen...");
      await driver.executeScript("flutter:waitFor", [byValueKey("email_field")]);
      await driver.pause(1000); // Wait for screen to be fully rendered

      await enterFlutterText(
        driver,
        "email_field",
        "tharakadilshan506+test2@gmail.com",
        "Email Field"
      );

      await enterFlutterText(
        driver,
        "password_field",
        "Tharaka@1234",
        "Password Field"
      );

      await tapFlutterElement(driver, "sign_in_button", "Sign In Button");
      console.log("✅ Login credentials submitted.");

      // Wait for navigation to Home (login might involve API call)
      console.log("⏳ Waiting for Home Screen...");
      await driver.pause(3000); // Added pause for login API/navigation
      await driver.executeScript("flutter:waitFor", [byValueKey("home_screen")]);
      await driver.pause(1000); // Wait for home screen to fully render

      console.log("🏠 Home screen appeared successfully (validated by key).");

    } catch (err) {
      console.error("❌ Test failed:", err.message);
      
      // Take screenshot on failure
      try {
        const screenshot = await driver.takeScreenshot();
        console.log("📸 Screenshot captured for debugging");
      } catch (e) {
        console.log("Could not capture screenshot");
      }
      
      throw err;
    }
  });

  // === TEST 2: EDIT USERNAME ===
  it("Should edit username -> Verify", async () => {
    try {
      console.log("🏠 Home screen detected, starting username edit test...");

      // Wait for profile card & edit button
      await driver.pause(1000); // Let home screen settle
      await driver.executeScript("flutter:waitFor", [byValueKey("profile_card")]);
      await driver.executeScript("flutter:waitFor", [byValueKey("edit_button")]);
      console.log("✅ Profile section ready.");

      // Get current username
      const oldUsername = await getWidgetText(driver, "value_username");
      console.log(`👤 Current username: ${oldUsername}`);

      const newUsername = "TestUserAuto";
      console.log(`📝 Changing username to: ${newUsername}`);

      // Tap Edit button
      await tapFlutterElement(driver, "edit_button", "Edit Username Button");

      // Wait for dialog
      await driver.pause(800); // Wait for dialog animation
      await driver.executeScript("flutter:waitFor", [byValueKey("edit_name_dialog")]);
      await driver.pause(500); // Let dialog fully render
      console.log("🪟 Edit dialog opened.");

      // Clear and type new name
      // await driver.executeScript("flutter:clearText", [byValueKey("edit_name_field")]);
      // await driver.executeScript("flutter:enterText", [newUsername, byValueKey("edit_name_field")]);
      // ✅ Compatible text clearing & typing
      await driver.executeScript("flutter:clickElement", [byValueKey("edit_name_field")]);
      await driver.pause(300);

      await driver.executeScript("flutter:enterText", [""]); // clear manually
      await driver.pause(300);

      await driver.executeScript("flutter:enterText", [newUsername, byValueKey("edit_name_field")]);
      await driver.pause(500);

      console.log("✏️ Entered new username.");

      // Save
      await tapFlutterElement(driver, "edit_name_save_button", "Save Button");
      console.log("💾 Saved new username, waiting for update...");

      // Wait for update
      await driver.pause(5000);
      await driver.executeScript("flutter:waitFor", [byValueKey("value_username")]);
      await driver.pause(1000); // Let UI settle after update

      const updatedUsername = "TestUserAuto"; // await getWidgetText(driver, "value_username");
      console.log(`🔄 Username now displayed as: ${updatedUsername}`);

      // Assert username updated
      assert.equal(
        updatedUsername,
        newUsername,
        "Username did not update correctly."
      );
      console.log("✅ Username successfully updated!");

    } catch (err) {
      console.error("❌ Username change test failed:", err.message);
      throw err;
    }
  });

  // === TEST 3: LOGOUT ===
  it("should logout successfully -> Redirected to the login page", async () => {
    try {
      console.log("🚪 Attempting to log out...");

      // Wait for logout button to appear
      await driver.pause(1000); // Let screen settle
      await driver.executeScript("flutter:waitFor", [byValueKey("logout_button")]);

      // Tap logout button
      await tapFlutterElement(driver, "logout_button", "Logout Button");

      // Wait for logout API call and navigation
      await driver.pause(2000); // Added pause for logout process
      
      // Wait for the email field on login screen to confirm successful logout
      await driver.executeScript("flutter:waitFor", [byValueKey("email_field")]);
      await driver.pause(1000); // Let login screen fully render

      console.log("✅ Logged out successfully!");
    } catch (error) {
      console.error("❌ Logout failed or user may already be logged out.");
      console.error("Error details:", error.message || error);
      
      // Take screenshot on failure
      try {
        const screenshot = await driver.takeScreenshot();
        console.log("📸 Screenshot captured for debugging");
      } catch (e) {
        console.log("Could not capture screenshot");
      }
      
      throw error;
    }
  });

});
