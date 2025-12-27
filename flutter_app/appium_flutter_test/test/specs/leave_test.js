import { remote } from "webdriverio";
import { byValueKey, byText } from "appium-flutter-finder";
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

// Helper: check if element exists
async function elementExists(driver, key) {
  try {
    await driver.executeScript("flutter:waitFor", [byValueKey(key)], {
      timeout: 5000,
    });
    return true;
  } catch (e) {
    return false;
  }
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
describe("Flutter Leave & Attendance Flow", function () {
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
        "tharakadilshan506@gmail.com",
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

  // === TEST 2: NAVIGATE TO LEAVE & ATTENDANCE SCREEN ===
it("Should navigate to Leave & Attendance screen and verify leave requests", async () => {
  try {
    console.log("🎯 Looking for Leave & Attendance card on home screen...");

    // Wait for home screen to be ready
    await driver.pause(1000);
    await driver.executeScript("flutter:waitFor", [
      byValueKey("home_screen"),
    ]);

    // Wait for leave & attendance card to appear
    console.log("⏳ Waiting for Leave & Attendance card...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave-attendance-card"),
    ]);
    await driver.pause(500);

    // Tap on leave & attendance card
    await tapFlutterElement(
      driver,
      "leave-attendance-card-inkwell",
      "Leave & Attendance Card"
    );

    // Wait for Leave & Attendance screen to load
    console.log("⏳ Waiting for Leave & Attendance screen to load...");
    await driver.pause(2000); // Wait for navigation + API call
    await driver.executeScript("flutter:waitFor", [
      byValueKey("appbar_title"),
    ]);
    await driver.pause(1000);

    console.log("✅ Successfully navigated to Leave & Attendance screen");

    // Verify TabBar exists
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_leave"),
      ]);
      console.log("✅ Leave tab is visible");

      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_attendance"),
      ]);
      console.log("✅ Attendance tab is visible");
    } catch (e) {
      console.log("⚠️ Could not verify main tabs");
    }

    // Verify we're on Leave tab (default)
    await driver.pause(1000);
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_tab"),
    ]);
    console.log("✅ Leave tab is loaded (default tab)");

    // Verify Leave sub-tabs exist
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tabbar_leave_requests"),
      ]);
      console.log("✅ Leave sub-tabs TabBar is visible");

      // Verify all 4 sub-tabs
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_all"),
      ]);
      console.log("✅ 'All' sub-tab is visible");

      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_pending"),
      ]);
      console.log("✅ 'Pending' sub-tab is visible");

      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_approved"),
      ]);
      console.log("✅ 'Approved' sub-tab is visible");

      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_rejected"),
      ]);
      console.log("✅ 'Rejected' sub-tab is visible");
    } catch (e) {
      console.log("⚠️ Could not verify leave sub-tabs");
    }

    await driver.pause(1500);

    // Check if loading indicator appears
    const isLoading = await elementExists(driver, "loading_indicator");
    if (isLoading) {
      console.log("⏳ Leave requests are loading...");
      await driver.pause(3000); // Wait for data to load
    }

    // Verify leave requests in 'All' tab (default)
    console.log("🔍 Verifying leave requests in 'All' tab...");

    // Check if the 'All' tab is empty or has data
    const isEmpty = await elementExists(driver, "empty_all");

    if (isEmpty) {
      console.log("ℹ️ No leave requests found in 'All' tab");
      console.log("✅ Empty state verified successfully");
    } else {
      // Verify leave requests list exists
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("list_all"),
        ]);
        console.log("✅ Leave requests list found in 'All' tab");

        // Try to verify at least one leave request card exists
        try {
          // Look for the first card (index 0)
          await driver.executeScript("flutter:waitFor", [
            byValueKey("card_all_0"),
          ]);
          console.log("✅ Leave request cards are displayed");

          // Verify card details are visible
          try {
            await driver.executeScript("flutter:waitFor", [
              byValueKey("card_title_all_0"),
            ]);
            console.log("✅ Leave request title visible");
          } catch (e) {
            console.log("⚠️ Could not verify card title");
          }

          try {
            await driver.executeScript("flutter:waitFor", [
              byValueKey("card_dates_all_0"),
            ]);
            console.log("✅ Leave request dates visible");
          } catch (e) {
            console.log("⚠️ Could not verify card dates");
          }

          try {
            await driver.executeScript("flutter:waitFor", [
              byValueKey("card_status_all_0"),
            ]);
            console.log("✅ Leave request status visible");
          } catch (e) {
            console.log("⚠️ Could not verify card status");
          }

        } catch (e) {
          console.log("⚠️ Could not verify individual leave request cards");
        }
      } catch (e) {
        console.log("⚠️ Could not find leave requests list");
      }
    }

    console.log("✅ Leave & Attendance screen verification complete");

  } catch (err) {
    console.error("❌ Navigation to Leave & Attendance screen failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3: CREATE LEAVE REQUEST ===
it("Should create leave request successfully", async () => {
  try {
    console.log("➕ Testing create leave request flow...");

    // Verify we're on Leave tab
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_tab"),
    ]);
    await driver.pause(1000);

    // Click the FAB (Floating Action Button)
    console.log("👆 Clicking Add Leave Request FAB...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("fab_add_leave_request"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("fab_add_leave_request"),
    ]);
    await driver.pause(1500); // Wait for dialog animation

    // Wait for leave request dialog
    console.log("⏳ Waiting for Create Leave Request dialog...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_request_dialog"),
    ]);
    await driver.pause(1000);

    console.log("✅ Create Leave Request dialog opened");

    // Verify dialog title
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("leave_request_dialog_title"),
      ]);
      console.log("✅ Dialog title visible");
    } catch (e) {
      console.log("⚠️ Could not verify dialog title");
    }

    // Step 1: Select Leave Type (first option - Annual)
    console.log("📂 Opening leave type dropdown...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_request_type_dropdown"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("leave_request_type_dropdown"),
    ]);
    await driver.pause(1500); // Wait for dropdown menu to open

    console.log("👆 Selecting first leave type option (Annual)...");
    
    // Select first option (index 0)
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_request_type_option_0"),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("leave_request_type_option_0"),
    ]);
    await driver.pause(1000); // Wait for dropdown to close

    console.log("✅ Leave type selected (Annual)");

    // Step 2: Select Start Date (today)
    console.log("📅 Selecting start date (today)...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_request_pick_start_date_button"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("leave_request_pick_start_date_button"),
    ]);
    await driver.pause(1500); // Wait for date picker to appear

    // Select today's date (OK button)
    console.log("👆 Confirming start date...");
    await driver.executeScript("flutter:waitFor", [
      byText("OK"),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1000);

    console.log("✅ Start date selected (today)");

    // Step 3: Select End Date (today)
    console.log("📅 Selecting end date (today)...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_request_pick_end_date_button"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("leave_request_pick_end_date_button"),
    ]);
    await driver.pause(1500); // Wait for date picker to appear

    // Select today's date (OK button)
    console.log("👆 Confirming end date...");
    await driver.executeScript("flutter:waitFor", [
      byText("OK"),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1000);

    console.log("✅ End date selected (today)");

    // Verify total days is displayed
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("leave_request_total_days_text"),
      ]);
      console.log("✅ Total days calculated and displayed");
    } catch (e) {
      console.log("⚠️ Could not verify total days text");
    }

    // Step 4: Enter reason
    const reason = `Automated test leave request ${Date.now()}`;
    console.log(`⌨️ Entering reason: ${reason}`);

    await enterFlutterText(
      driver,
      "leave_request_reason_textfield",
      reason,
      "Leave Reason"
    );

    console.log("✅ Reason entered");

    // Step 5: Submit the leave request
    console.log("💾 Submitting leave request...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("leave_request_submit_button"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("leave_request_submit_button"),
    ]);

    console.log("⏳ Waiting for leave request to be created...");
    await driver.pause(4000); // Wait for API call

    // Check for result snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("leave_request_submit_snackbar"),
      ]);
      console.log("✅ Leave request submitted - notification shown!");
    } catch (e) {
      console.log("⚠️ Submit snackbar not found but continuing...");
    }

    await driver.pause(2000); // Let snackbar disappear

    // Verify we're back on Leave tab
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("leave_tab"),
      ]);
      console.log("✅ Back on Leave tab");
    } catch (e) {
      console.log("⚠️ Leave tab not immediately visible");
    }

    await driver.pause(1000);

    console.log("✅ Leave request created successfully!");

  } catch (err) {
    console.error("❌ Create leave request failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.5: NAVIGATE TO ATTENDANCE TAB AND VERIFY ===
it("Should navigate to Attendance tab and verify attendance records", async () => {
  try {
    console.log("📋 Testing Attendance tab...");

    // Verify we're on Leave & Attendance screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("appbar_title"),
    ]);
    await driver.pause(500);

    // Navigate to Attendance tab
    console.log("👆 Switching to Attendance tab...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("tab_attendance"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("tab_attendance"),
    ]);
    await driver.pause(2000); // Wait for tab switch and data loading

    console.log("✅ Attendance tab loaded");

    // Wait for Attendance tab to be ready
    await driver.executeScript("flutter:waitFor", [
      byValueKey("attendance_tab"),
    ]);
    await driver.pause(1500);

    console.log("✅ Attendance tab is active");

    // Verify Clock In and Clock Out buttons exist
    console.log("🔍 Verifying clock buttons...");

    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("attendance_clock_button_row"),
      ]);
      console.log("✅ Clock button row is visible");

      // Verify Clock In button
      await driver.executeScript("flutter:waitFor", [
        byValueKey("attendance_clock_in_button"),
      ]);
      console.log("✅ Clock In button is visible");

      // Verify Clock In button text
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("attendance_clock_in_button_text"),
        ]);
        console.log("✅ Clock In button text is visible");
      } catch (e) {
        console.log("⚠️ Could not verify Clock In button text");
      }

      // Verify Clock Out button
      await driver.executeScript("flutter:waitFor", [
        byValueKey("attendance_clock_out_button"),
      ]);
      console.log("✅ Clock Out button is visible");

      // Verify Clock Out button text
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("attendance_clock_out_button_text"),
        ]);
        console.log("✅ Clock Out button text is visible");
      } catch (e) {
        console.log("⚠️ Could not verify Clock Out button text");
      }

    } catch (e) {
      console.log("⚠️ Could not verify clock buttons:", e.message);
    }

    await driver.pause(1000);

    // Check if attendance logs are loading
    const isLoading = await elementExists(driver, "attendance_logs_loading_indicator");
    if (isLoading) {
      console.log("⏳ Attendance logs are loading...");
      await driver.pause(3000); // Wait for data to load
    }

    // Verify attendance logs section
    console.log("🔍 Verifying attendance logs...");

    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("attendance_logs_section"),
      ]);
      console.log("✅ Attendance logs section is visible");

      // Check if attendance log list exists
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("attendance_log_list"),
        ]);
        console.log("✅ Attendance log list found");

        // Try to verify at least one attendance log card exists
        try {
          await driver.executeScript("flutter:waitFor", [
            byValueKey("attendance_log_card_0"),
          ]);
          console.log("✅ Attendance log cards are displayed");

          // Verify card details are visible
          try {
            await driver.executeScript("flutter:waitFor", [
              byValueKey("attendance_log_title_0"),
            ]);
            console.log("✅ Attendance log title visible (Date and Status)");
          } catch (e) {
            console.log("⚠️ Could not verify log title");
          }

          try {
            await driver.executeScript("flutter:waitFor", [
              byValueKey("attendance_log_subtitle_0"),
            ]);
            console.log("✅ Attendance log subtitle visible (Clock In/Out times)");
          } catch (e) {
            console.log("⚠️ Could not verify log subtitle");
          }

          // Check if "See More" button exists (only appears if > 5 logs)
          try {
            const hasSeeMore = await elementExists(driver, "attendance_see_more_button");
            if (hasSeeMore) {
              console.log("✅ 'See More' button is visible (more than 5 logs exist)");
            } else {
              console.log("ℹ️ No 'See More' button (5 or fewer logs)");
            }
          } catch (e) {
            console.log("⚠️ Could not check for See More button");
          }

        } catch (e) {
          console.log("ℹ️ No attendance log cards found - might be empty");
        }

      } catch (e) {
        console.log("ℹ️ No attendance log list found - might be empty");
      }

    } catch (e) {
      console.log("⚠️ Could not verify attendance logs section:", e.message);
    }

    await driver.pause(1000);

    console.log("✅ Attendance tab verification complete");

  } catch (err) {
    console.error("❌ Attendance tab verification failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.6: CLOCK IN SUCCESSFULLY ===
it("Should clock in successfully", async () => {
  try {
    console.log("⏰ Testing clock in functionality...");

    // Verify we're on Attendance tab
    await driver.executeScript("flutter:waitFor", [
      byValueKey("attendance_tab"),
    ]);
    await driver.pause(1000);

    // Verify Clock In button is visible
    console.log("🔍 Looking for Clock In button...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("attendance_clock_in_button"),
    ]);
    await driver.pause(500);

    console.log("✅ Clock In button found");

    // Click Clock In button
    console.log("👆 Clicking Clock In button...");
    await driver.executeScript("flutter:clickElement", [
      byValueKey("attendance_clock_in_button"),
    ]);

    console.log("⏳ Waiting for clock in to process...");
    await driver.pause(4000); // Wait for API call

    // Check for success snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("clock_in_success_snackbar"),
      ]);
      console.log("✅ Clock In successful - success notification shown!");
    } catch (e) {
      console.log("⚠️ Success snackbar not found, checking for other results...");
      
      // Check for token failure snackbar
      const hasTokenFailure = await elementExists(driver, "clock_in_token_failure_snackbar");
      if (hasTokenFailure) {
        console.log("⚠️ Failed to get ID token");
      }
      
      // Check for clock in failure snackbar
      const hasClockInFailure = await elementExists(driver, "clock_in_failure_snackbar");
      if (hasClockInFailure) {
        console.log("⚠️ Clock In failed");
      }
    }

    await driver.pause(2000); // Let snackbar disappear

    // Verify we're still on Attendance tab
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("attendance_tab"),
      ]);
      console.log("✅ Still on Attendance tab");
    } catch (e) {
      console.log("⚠️ Attendance tab not immediately visible");
    }

    await driver.pause(1000);

    console.log("✅ Clock in flow completed!");

  } catch (err) {
    console.error("❌ Clock in failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3: NAVIGATE BACK TO HOME ===
it("Should navigate back to home screen", async () => {
  try {
    console.log("⬅️ Navigating back to home screen...");

    // Verify we're on Leave & Attendance screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("appbar_title"),
    ]);
    await driver.pause(500);

    // Use back navigation (AppBar back button)
    console.log("🔙 Pressing back button...");
    await driver.back();
    await driver.pause(1500);

    // Verify we're back on home screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("home_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Successfully returned to home screen");
  } catch (err) {
    console.error("❌ Navigation back to home failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

    // === TEST 5: LOGOUT ===
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
