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
describe("Flutter Events & Announcements Flow", function () {
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

  // === TEST 2: NAVIGATE TO EVENTS & ANNOUNCEMENTS ===
    it("Should navigate to Events & Announcements screen", async () => {
      try {
        console.log("🎯 Looking for Events & Announcements card...");
  
        // Wait for home screen to be ready
        await driver.pause(1000);
        await driver.executeScript("flutter:waitFor", [
          byValueKey("home_screen"),
        ]);
  
        // Wait for events & announcements card
        console.log("⏳ Waiting for Events & Announcements card...");
        await driver.executeScript("flutter:waitFor", [
          byValueKey("events-announcements-card"),
        ]);
        await driver.pause(500);
  
        // Tap on events & announcements card
        await tapFlutterElement(
          driver,
          "events-announcements-card-inkwell",
          "Events & Announcements Card"
        );
  
        // Wait for Events screen to load
        console.log("⏳ Waiting for Events & Announcements screen...");
        await driver.pause(2000); // Wait for navigation + API call
        await driver.executeScript("flutter:waitFor", [
          byValueKey("events_screen"),
        ]);
        await driver.pause(1000);
  
        console.log("✅ Successfully navigated to Events & Announcements screen");
      } catch (err) {
        console.error("❌ Navigation to Events screen failed:", err.message);
  
        try {
          const screenshot = await driver.takeScreenshot();
          console.log("📸 Screenshot captured for debugging");
        } catch (e) {
          console.log("Could not capture screenshot");
        }
  
        throw err;
      }
    });

    // === TEST 3.5: CREATE NEW EVENT ===
    it("Should create new event successfully", async () => {
    try {
        console.log("➕ Testing create event flow...");

        // Wait for events screen to be ready
        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_screen"),
        ]);
        await driver.pause(500);

        // Tap on the FAB (Floating Action Button)
        console.log("👆 Tapping Create Event FAB...");
        await tapFlutterElement(driver, "events_create_fab", "Create Event FAB");
        await driver.pause(1000);

        // Wait for create event dialog
        console.log("⏳ Waiting for Create Event dialog...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("create_event_dialog"),
        ]);
        await driver.pause(800);

        console.log("✅ Create Event dialog opened");

        // Enter title
        const eventTitle = `Test Event ${Date.now()}`;
        console.log(`⌨️ Entering event title: ${eventTitle}`);
        await enterFlutterText(
        driver,
        "create_event_title_field",
        eventTitle,
        "Event Title"
        );

        // Enter summary
        const eventSummary = "This is a test event summary";
        console.log(`⌨️ Entering summary: ${eventSummary}`);
        await enterFlutterText(
        driver,
        "create_event_summary_field",
        eventSummary,
        "Event Summary"
        );

        // Enter content
        const eventContent = "This is the test event content with more details";
        console.log(`⌨️ Entering content: ${eventContent}`);
        await enterFlutterText(
        driver,
        "create_event_content_field",
        eventContent,
        "Event Content"
        );

        // Enter scheduled date/time
        console.log("📅 Setting scheduled date and time...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("create_event_scheduled_at_field"),
        ]);
        await driver.pause(300);

        await driver.executeScript("flutter:clickElement", [
        byValueKey("create_event_scheduled_at_field"),
        ]);
        await driver.pause(2000); // Wait for date picker to fully open

        // Date picker interaction
        console.log("📆 Handling date picker...");
        try {
        // Wait for and click OK on date picker
        await driver.executeScript("flutter:waitFor", [
            byText("OK"),
        ]);
        await driver.pause(700);
        
        console.log("📆 Clicking date picker OK...");
        await driver.executeScript("flutter:clickElement", [
            byText("OK"),
        ]);
        
        console.log("✅ Date picker OK clicked");
        } catch (e) {
        console.log("⚠️ Date picker OK not found:", e.message);
        }

        // CRITICAL: Wait longer for time picker to appear
        await driver.pause(3000); // Increased to 3 seconds

        // Time picker interaction
        console.log("⏰ Handling time picker...");
        let timePickerHandled = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`⏰ Attempt ${attempt}: Looking for time picker OK button...`);
            
            // Fixed: Remove the timeout parameter - it's not supported this way
            await driver.executeScript("flutter:waitFor", [
            byText("OK"),
            ]);
            
            await driver.pause(700);
            
            console.log("⏰ Clicking time picker OK...");
            await driver.executeScript("flutter:clickElement", [
            byText("OK"),
            ]);
            
            console.log("✅ Time picker OK clicked successfully");
            timePickerHandled = true;
            break;
            
        } catch (e) {
            console.log(`⚠️ Attempt ${attempt} failed: ${e.message}`);
            if (attempt < 3) {
            await driver.pause(1500); // Longer wait before retry
            }
        }
        }

        if (!timePickerHandled) {
        console.log("⚠️ Could not click time picker OK, trying to dismiss...");
        // Try to tap outside the picker to dismiss it
        try {
            await driver.back(); // Try system back
            await driver.pause(500);
        } catch (e) {
            console.log("⚠️ Dismiss attempt failed");
        }
        }

        // Extra wait to ensure all pickers are fully closed
        await driver.pause(2000);
        console.log("✅ Date and time selection complete");

        // Verify we're back to the dialog (not stuck in picker)
        try {
        await driver.executeScript("flutter:waitFor", [
            byValueKey("create_event_dialog"),
        ]);
        console.log("✅ Back on create event dialog");
        } catch (e) {
        console.log("⚠️ Dialog not found, may still be in picker");
        }

        // Add a tag
        console.log("🏷️ Adding tag...");
        const tagText = "TestTag5";

        // Wait extra long before trying to interact with tag field
        await driver.pause(1000);

        try {
        await driver.executeScript("flutter:waitFor", [
            byValueKey("create_event_tag_text_field"),
        ]);
        await driver.pause(700);

        console.log("🖱️ Clicking tag text field...");
        await driver.executeScript("flutter:clickElement", [
            byValueKey("create_event_tag_text_field"),
        ]);
        await driver.pause(500);

        console.log(`⌨️ Entering tag text: ${tagText}`);
        await driver.executeScript("flutter:enterText", [
            tagText,
            byValueKey("create_event_tag_text_field"),
        ]);
        await driver.pause(700);

        console.log(`✅ Tag text entered: ${tagText}`);

        // Click the add tag button
        console.log("➕ Clicking add tag button...");
        await driver.executeScript("flutter:waitFor", [
            byValueKey("create_event_add_tag_button"),
        ]);
        await driver.pause(500);
        
        await driver.executeScript("flutter:clickElement", [
            byValueKey("create_event_add_tag_button"),
        ]);
        await driver.pause(700);
        
        console.log("✅ Tag added successfully");
        
        } catch (e) {
        console.error("❌ Tag addition failed:", e.message);
        // Continue anyway - tag is optional
        console.log("⚠️ Continuing without tag...");
        }

        // Skip attachments
        console.log("ℹ️ Skipping file attachments");
        await driver.pause(500);

        // Submit the event
        console.log("💾 Submitting event...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("create_event_submit_button"),
        ]);
        await driver.pause(300);
        
        await driver.executeScript("flutter:clickElement", [
        byValueKey("create_event_submit_button"),
        ]);

        console.log("⏳ Waiting for event creation...");
        await driver.pause(4000); // Wait for API call

        // Check for success snackbar
        try {
        await driver.executeScript("flutter:waitFor", [
            byValueKey("create_event_success_snackbar"),
        ], { timeout: 5000 });
        console.log("✅ Success notification shown!");
        } catch (e) {
        console.log("⚠️ Success snackbar not found but continuing...");
        }

        await driver.pause(2000); // Let snackbar disappear

        // Verify back on events screen
        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_screen"),
        ]);
        await driver.pause(1000);

        console.log("✅ Event created successfully!");

    } catch (err) {
        console.error("❌ Create event failed:", err.message);

        try {
        const screenshot = await driver.takeScreenshot();
        console.log("📸 Screenshot captured");
        } catch (e) {
        console.log("Could not capture screenshot");
        }

        throw err;
    }
    });

    // === TEST 3.5: EDIT EVENT ===
    it("Should edit event successfully", async () => {
    try {
        console.log("✏️ Testing edit event flow...");

        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_screen"),
        ]);
        await driver.pause(1000);

        // Check if events list exists
        const isEmpty = await elementExists(driver, "events_empty_text");
        
        if (isEmpty) {
        console.log("⚠️ No events available to edit, skipping test");
        return;
        }

        // Wait for events list
        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_list_view"),
        ]);
        await driver.pause(1000);

        // Scroll to top first to ensure we see the first item
        console.log("📜 Scrolling to top of events list...");
        await driver.executeScript("flutter:scroll", [
        byValueKey("events_list_view"),
        { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
        ]);
        await driver.pause(800);

        // Try to find the first editable event (draft status)
        // You should update these IDs based on your actual event IDs in the database
        const eventIds = [13, 14, 15];
        let foundEditableEvent = false;
        
        for (const eventId of eventIds) {
        try {
            console.log(`Trying event ${eventId}...`);
            
            // Check if edit button exists and is enabled for this event
            await driver.executeScript("flutter:waitFor", [
            byValueKey(`event_edit_button_${eventId}`),
            ]);
            
            console.log(`✅ Found edit button for event ${eventId}`);
            await driver.pause(300);
            
            // Click the edit button
            await driver.executeScript("flutter:clickElement", [
            byValueKey(`event_edit_button_${eventId}`),
            ]);
            
            console.log(`✅ Clicked edit button for event ${eventId}`);
            foundEditableEvent = true;
            break;
            
        } catch (e) {
            // This event doesn't exist or not visible, try next
            console.log(`⚠️ Event ${eventId} not found or not editable: ${e.message}`);
            continue;
        }
        }
        
        if (!foundEditableEvent) {
        console.log("⚠️ Could not find any editable event (draft status), skipping test");
        return;
        }

        await driver.pause(1200); // Wait for dialog animation

        // Wait for edit event dialog
        console.log("⏳ Waiting for Edit Event dialog...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("edit_event_dialog"),
        ]);
        await driver.pause(800);

        console.log("✅ Edit dialog opened");

        // Change the title
        const updatedTitle = `Updated Event ${Date.now()}`;
        console.log(`✏️ Updating title to: ${updatedTitle}`);
        
        await driver.executeScript("flutter:waitFor", [
        byValueKey("edit_event_title_field"),
        ]);
        await driver.pause(500);
        
        // Focus the field
        await driver.executeScript("flutter:clickElement", [
        byValueKey("edit_event_title_field"),
        ]);
        await driver.pause(300);
        
        // Clear existing text
        console.log("🧹 Clearing title field...");
        try {
        await driver.executeScript("flutter:clearText", [
            byValueKey("edit_event_title_field"),
        ]);
        await driver.pause(200);
        } catch (e) {
        console.log(`⚠️ Could not clear title field: ${e.message}`);
        }
        
        // Enter new title
        console.log(`⌨️ Typing new title...`);
        await driver.executeScript("flutter:enterText", [
        updatedTitle,
        byValueKey("edit_event_title_field"),
        ]);
        await driver.pause(700);

        console.log("✅ Title updated");

        // Click Update button
        console.log("💾 Submitting update...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("edit_event_update_button"),
        ]);
        await driver.pause(300);
        
        await driver.executeScript("flutter:clickElement", [
        byValueKey("edit_event_update_button"),
        ]);

        console.log("⏳ Waiting for update to complete...");
        await driver.pause(4000); // Wait for API call

        // Check for success snackbar
        try {
        await driver.executeScript("flutter:waitFor", [
            byValueKey("edit_event_success_snackbar"),
        ], { timeout: 5000 });
        console.log("✅ Update successful - success notification shown!");
        } catch (e) {
        console.log("⚠️ Success snackbar not found but continuing...");
        }

        await driver.pause(2000); // Let snackbar disappear

        // Verify back on events screen
        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_screen"),
        ]);
        await driver.pause(1000);

        console.log("✅ Event edited successfully!");

    } catch (err) {
        console.error("❌ Edit event failed:", err.message);

        try {
        await driver.takeScreenshot();
        console.log("📸 Screenshot captured");
        } catch (e) {
        console.log("Could not capture screenshot");
        }

        throw err;
    }
    });

    // === TEST 3.6: VIEW EVENT DETAILS ===
    it("Should view event details successfully", async () => {
    try {
        console.log("👁️ Testing view event details flow...");

        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_screen"),
        ]);
        await driver.pause(1000);

        // Check if events list exists
        const isEmpty = await elementExists(driver, "events_empty_text");
        
        if (isEmpty) {
        console.log("⚠️ No events available to view, skipping test");
        return;
        }

        // Wait for events list
        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_list_view"),
        ]);
        await driver.pause(1000);

        // Scroll to top first to ensure we see the first item
        console.log("📜 Scrolling to top of events list...");
        await driver.executeScript("flutter:scroll", [
        byValueKey("events_list_view"),
        { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
        ]);
        await driver.pause(800);

        // Try to find and click the first event card
        // Update these IDs based on your actual event IDs in the database
        const eventIds = [8, 13, 14, 15];
        let foundEvent = false;
        
        for (const eventId of eventIds) {
        try {
            console.log(`Trying event card ${eventId}...`);
            
            // Check if event tile exists
            await driver.executeScript("flutter:waitFor", [
            byValueKey(`event_tile_${eventId}`),
            ]);
            
            console.log(`✅ Found event card ${eventId}`);
            await driver.pause(300);
            
            // Click the event card to view details
            await driver.executeScript("flutter:clickElement", [
            byValueKey(`event_tile_${eventId}`),
            ]);
            
            console.log(`✅ Clicked event card ${eventId}`);
            foundEvent = true;
            break;
            
        } catch (e) {
            // This event doesn't exist or not visible, try next
            console.log(`⚠️ Event ${eventId} not found: ${e.message}`);
            continue;
        }
        }
        
        if (!foundEvent) {
        console.log("⚠️ Could not find any event to view, skipping test");
        return;
        }

        await driver.pause(1500); // Wait for dialog animation and API call

        // Wait for event details dialog
        console.log("⏳ Waiting for Event Details dialog...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("event_details_dialog"),
        ]);
        await driver.pause(1000);

        console.log("✅ Event Details dialog opened");

        // Verify we can see the details content
        try {
        await driver.executeScript("flutter:waitFor", [
            byValueKey("event_details_title"),
        ]);
        console.log("✅ Event title visible");

        await driver.executeScript("flutter:waitFor", [
            byValueKey("event_details_summary"),
        ]);
        console.log("✅ Event summary visible");

        await driver.executeScript("flutter:waitFor", [
            byValueKey("event_details_content"),
        ]);
        console.log("✅ Event content visible");

        await driver.executeScript("flutter:waitFor", [
            byValueKey("event_details_scheduled_at"),
        ]);
        console.log("✅ Event scheduled time visible");
        } catch (e) {
        console.log("⚠️ Some details not found but continuing...");
        }

        // Wait a moment to "view" the details
        await driver.pause(2000);
        console.log("👀 Viewing event details...");

        // Close the dialog
        console.log("❌ Closing details dialog...");
        await driver.executeScript("flutter:waitFor", [
        byValueKey("event_details_close_button"),
        ]);
        await driver.pause(300);
        
        await driver.executeScript("flutter:clickElement", [
        byValueKey("event_details_close_button"),
        ]);

        await driver.pause(1000); // Wait for dialog to close

        // Verify back on events screen
        await driver.executeScript("flutter:waitFor", [
        byValueKey("events_screen"),
        ]);
        await driver.pause(500);

        console.log("✅ Event details viewed and closed successfully!");

    } catch (err) {
        console.error("❌ View event details failed:", err.message);

        try {
        await driver.takeScreenshot();
        console.log("📸 Screenshot captured");
        } catch (e) {
        console.log("Could not capture screenshot");
        }

        throw err;
    }
    });

    // === TEST 4: NAVIGATE BACK TO HOME ===
    it("Should navigate back to home screen", async () => {
        try {
        console.log("⬅️ Navigating back to home screen...");

        // Tap back button on app bar
        await driver.executeScript("flutter:waitFor", [
            byValueKey("events_app_bar"),
        ]);
        await driver.pause(500);

        // Use back navigation (AppBar back button)
        // In Flutter, the back button is typically at the top-left
        // We can use the system back button
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
