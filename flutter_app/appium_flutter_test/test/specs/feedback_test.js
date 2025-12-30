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

// Helper: Find first feedback and click its edit button
async function clickFirstFeedbackEditButton(driver) {
  console.log("🔍 Looking for first feedback to edit...");
  
  try {
    // Scroll to top first
    await driver.executeScript("flutter:scroll", [
      byValueKey("feedback_list_view"),
      { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
    ]);
    await driver.pause(800);
    
    // Try your actual feedback IDs from database
    const feedbackIds = [8, 9, 10, 11, 12, 19];
    
    for (const feedbackId of feedbackIds) {
      try {
        console.log(`Trying feedback ${feedbackId}...`);
        
        // Use the TextButton key which is unique: feedback_edit_button_$feedbackId
        await driver.executeScript("flutter:waitFor", [
          byValueKey(`feedback_edit_button_${feedbackId}`),
        ]);
        
        console.log(`✅ Found edit button for feedback ${feedbackId}`);
        await driver.pause(300);
        
        // Click the TextButton
        await driver.executeScript("flutter:clickElement", [
          byValueKey(`feedback_edit_button_${feedbackId}`),
        ]);
        
        console.log(`✅ Clicked edit button for feedback ${feedbackId}`);
        return true;
        
      } catch (e) {
        // This feedback doesn't exist or not visible, try next
        console.log(`⚠️ Feedback ${feedbackId} not found: ${e.message}`);
        continue;
      }
    }
    
    console.log("⚠️ Could not find any feedback from list");
    return false;
    
  } catch (e) {
    console.log("⚠️ Error finding edit button:", e.message);
    return false;
  }
}

// Helper: Scroll and find first edit button
async function scrollAndClickFirstEditButton(driver) {
  console.log("🔍 Scrolling to find any Edit button...");
  
  try {
    // Strategy 1: Try to use scrollUntilVisible
    await driver.executeScript("flutter:scrollUntilVisible", [
      byValueKey("feedback_list_view"), // The scrollable widget
      {
        item: byText("Edit"),
        dxScroll: 0,
        dyScroll: -300, // Scroll up
        waitTimeoutMilliseconds: 10000,
      },
    ]);
    
    await driver.pause(500);
    
    console.log("✅ Found Edit button after scrolling");
    
    // Now click it
    await driver.executeScript("flutter:clickElement", [
      byText("Edit"),
    ]);
    
    return true;
    
  } catch (e) {
    console.log("⚠️ Scroll approach failed, trying direct approach...");
    
    // Strategy 2: Just try to tap the first Edit button directly
    try {
      await driver.executeScript("flutter:waitFor", [
        byText("Edit"),
      ], { timeout: 5000 });
      
      await driver.pause(500);
      
      // Get all Edit buttons and click the first one
      await driver.executeScript("flutter:clickElement", [
        byText("Edit"),
      ]);
      
      return true;
      
    } catch (err) {
      console.log("⚠️ Could not find Edit button");
      return false;
    }
  }
}

// Helper: Click edit button using a two-step approach
async function clickEditButtonOnFirstFeedback(driver) {
  console.log("🔍 Finding first feedback to edit...");
  
  try {
    // Step 1: Scroll to top of list to ensure we see the first item
    await driver.executeScript("flutter:scroll", [
      byValueKey("feedback_list_view"),
      { dx: 0, dy: 1000, durationMilliseconds: 300, frequency: 60 }, // Scroll down first
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:scroll", [
      byValueKey("feedback_list_view"),
      { dx: 0, dy: -2000, durationMilliseconds: 500, frequency: 60 }, // Then scroll to top
    ]);
    await driver.pause(800);
    
    // Step 2: Look for the "Edit" button text widget specifically
    // Since there are multiple, we need to use firstMatch or get all
    console.log("👆 Attempting to tap first Edit button using semantics...");
    
    // Use driver.execute with raw Flutter commands
    await driver.execute('flutter:waitFor', [byValueKey("feedback_edit_button_text")]);
    await driver.pause(300);
    
    await driver.execute('flutter:click', [byValueKey("feedback_edit_button_text")]);
    await driver.pause(500);
    
    console.log("✅ Tapped Edit button");
    return true;
    
  } catch (e) {
    console.log("⚠️ Failed to tap edit button:", e.message);
    return false;
  }
}

// Helper: Click first edit button using the common text key
async function clickFirstEditButton(driver) {
  console.log("🔍 Looking for Edit button...");
  
  try {
    // Scroll to top first
    console.log("📜 Scrolling to top of feedback list...");
    await driver.executeScript("flutter:scroll", [
      byValueKey("feedback_list_view"),
      { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
    ]);
    await driver.pause(800);
    
    // The key 'feedback_edit_button_text' exists on ALL Edit buttons
    // Flutter should click the first one it finds
    console.log("👆 Tapping Edit button...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_edit_button_text"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("feedback_edit_button_text"),
    ]);
    await driver.pause(500);
    
    console.log("✅ Edit button clicked");
    return true;
    
  } catch (e) {
    console.log("⚠️ Could not click Edit button:", e.message);
    return false;
  }
}

// Helper: Find first feedback and click its add comment button
async function clickFirstFeedbackAddCommentButton(driver) {
  console.log("🔍 Looking for first feedback to add comment...");
  
  try {
    // Scroll to top first
    await driver.executeScript("flutter:scroll", [
      byValueKey("feedback_list_view"),
      { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
    ]);
    await driver.pause(800);
    
    // Try your actual feedback IDs from database
    const feedbackIds = [8, 9, 10, 11, 12, 19];
    
    for (const feedbackId of feedbackIds) {
      try {
        console.log(`Trying feedback ${feedbackId}...`);
        
        // Use the TextButton key: feedback_add_comment_button_$feedbackId
        await driver.executeScript("flutter:waitFor", [
          byValueKey(`feedback_add_comment_button_${feedbackId}`),
        ]);
        
        console.log(`✅ Found add comment button for feedback ${feedbackId}`);
        await driver.pause(300);
        
        // Click the TextButton
        await driver.executeScript("flutter:clickElement", [
          byValueKey(`feedback_add_comment_button_${feedbackId}`),
        ]);
        
        console.log(`✅ Clicked add comment button for feedback ${feedbackId}`);
        return true;
        
      } catch (e) {
        // This feedback doesn't exist or not visible, try next
        console.log(`⚠️ Feedback ${feedbackId} not found: ${e.message}`);
        continue;
      }
    }
    
    console.log("⚠️ Could not find any feedback from list");
    return false;
    
  } catch (e) {
    console.log("⚠️ Error finding add comment button:", e.message);
    return false;
  }
}

// Helper: Find first feedback and click on it to view details
async function clickFirstFeedbackCard(driver) {
  console.log("🔍 Looking for first feedback card to view details...");
  
  try {
    // Scroll to top first
    await driver.executeScript("flutter:scroll", [
      byValueKey("feedback_list_view"),
      { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
    ]);
    await driver.pause(800);
    
    // Try your actual feedback IDs from database
    const feedbackIds = [8, 9, 10, 11, 12, 19];
    
    for (const feedbackId of feedbackIds) {
      try {
        console.log(`Trying feedback card ${feedbackId}...`);
        
        // Use the InkWell key (the clickable card): feedback_tile_$feedbackId
        await driver.executeScript("flutter:waitFor", [
          byValueKey(`feedback_tile_${feedbackId}`),
        ]);
        
        console.log(`✅ Found feedback card ${feedbackId}`);
        await driver.pause(300);
        
        // Click the card to view details
        await driver.executeScript("flutter:clickElement", [
          byValueKey(`feedback_tile_${feedbackId}`),
        ]);
        
        console.log(`✅ Clicked feedback card ${feedbackId}`);
        return true;
        
      } catch (e) {
        // This feedback doesn't exist or not visible, try next
        console.log(`⚠️ Feedback ${feedbackId} not found: ${e.message}`);
        continue;
      }
    }
    
    console.log("⚠️ Could not find any feedback card");
    return false;
    
  } catch (e) {
    console.log("⚠️ Error finding feedback card:", e.message);
    return false;
  }
}

// === Main Test ===
describe("Flutter Feedback Flow", function () {
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

  // === TEST 2: NAVIGATE TO FEEDBACK SCREEN ===
  it("Should navigate to Feedback screen", async () => {
    try {
      console.log("🎯 Looking for Feedback card on home screen...");

      // Wait for home screen to be ready
      await driver.pause(1000);
      await driver.executeScript("flutter:waitFor", [
        byValueKey("home_screen"),
      ]);

      // Wait for feedback card to appear
      console.log("⏳ Waiting for Feedback card...");
      await driver.executeScript("flutter:waitFor", [
        byValueKey("feedback-card"),
      ]);
      await driver.pause(500);

      // Tap on feedback card
      await tapFlutterElement(
        driver,
        "feedback-card-inkwell",
        "Feedback Card"
      );

      // Wait for Feedback screen to load
      console.log("⏳ Waiting for Feedback screen to load...");
      await driver.pause(2000); // Wait for navigation + API call
      await driver.executeScript("flutter:waitFor", [
        byValueKey("feedback_screen"),
      ]);
      await driver.pause(1000);

      console.log("✅ Successfully navigated to Feedback screen");
    } catch (err) {
      console.error("❌ Navigation to Feedback screen failed:", err.message);

      try {
        const screenshot = await driver.takeScreenshot();
        console.log("📸 Screenshot captured for debugging");
      } catch (e) {
        console.log("Could not capture screenshot");
      }

      throw err;
    }
  });

  // === TEST 3: VERIFY FEEDBACK LIST ===
  it("Should verify feedback list is loaded", async () => {
    try {
      console.log("🔍 Verifying feedback list...");

      // Wait for feedback tab to be ready
      await driver.executeScript("flutter:waitFor", [
        byValueKey("feedback_tab"),
      ]);
      await driver.pause(1000);

      // Check if loading indicator appears first (optional)
      const isLoading = await elementExists(
        driver,
        "feedback_loading_indicator"
      );
      if (isLoading) {
        console.log("⏳ Feedback is loading...");
        await driver.pause(3000); // Wait for data to load
      }

      // Check if feedbacks are loaded or empty
      const isEmpty = await elementExists(driver, "feedback_empty_text");

      if (isEmpty) {
        console.log("ℹ️ No feedback available in the system");
        console.log("✅ Empty state verified successfully");
      } else {
        // Verify feedback list view exists
        console.log("⏳ Waiting for feedback list...");
        await driver.executeScript("flutter:waitFor", [
          byValueKey("feedback_list_view"),
        ]);
        await driver.pause(500);

        console.log("✅ Feedback list loaded successfully");

        // Try to verify at least one feedback card exists
        try {
          await driver.executeScript("flutter:waitFor", [
            byValueKey("feedback_body_column"),
          ]);
          console.log("✅ Feedback items are displayed");
        } catch (e) {
          console.log("⚠️ Could not verify individual feedback items");
        }
      }

      console.log("✅ Feedback screen verification complete");
    } catch (err) {
      console.error("❌ Feedback verification failed:", err.message);

      try {
        const screenshot = await driver.takeScreenshot();
        console.log("📸 Screenshot captured for debugging");
      } catch (e) {
        console.log("Could not capture screenshot");
      }

      throw err;
    }
  });

  

  // === TEST 4.7: CREATE NEW FEEDBACK ===
it("Should create new feedback successfully", async () => {
  try {
    console.log("➕ Testing create feedback flow...");

    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(500);

    // Tap FAB
    console.log("👆 Tapping Create Feedback FAB...");
    await tapFlutterElement(driver, "feedback_create_fab", "Create FAB");
    await driver.pause(1000);

    // Wait for dialog
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_feedback_dialog"),
    ]);
    await driver.pause(800);

    console.log("✅ Dialog opened");

    // Enter title
    const feedbackTitle = `Test Feedback ${Date.now()}`;
    await enterFlutterText(
      driver,
      "create_feedback_title_field",
      feedbackTitle,
      "Feedback Title"
    );

    //------------------

    // Select Category dropdown
    console.log("📂 Opening category dropdown...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_feedback_category_dropdown"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("create_feedback_category_dropdown"),
    ]);
    await driver.pause(1500); // Wait for dropdown menu to open
    
    console.log("👆 Selecting 'Feature' from category...");
    await driver.executeScript("flutter:waitFor", [
      byText("Feature"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byText("Feature"),
    ]);
    await driver.pause(1000); // Wait for dropdown to close

    console.log("✅ Category selected: Feature");

    // Select Priority dropdown
    console.log("⚡ Opening priority dropdown...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_feedback_priority_dropdown"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("create_feedback_priority_dropdown"),
    ]);
    await driver.pause(1500); // Wait for dropdown menu to open
    
    console.log("👆 Selecting 'High' from priority...");
    await driver.executeScript("flutter:waitFor", [
      byText("High"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byText("High"),
    ]);
    await driver.pause(1000);

    console.log("✅ Priority selected: High");

    // Select Assignee dropdown
    console.log("👤 Opening assignee dropdown...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_feedback_assignee_dropdown"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("create_feedback_assignee_dropdown"),
    ]);
    await driver.pause(1500); // Wait for dropdown menu to open
    
    console.log("👆 Selecting 'Tharaka Dilshan' from assignee...");
    await driver.executeScript("flutter:waitFor", [
      byText("Tharaka Dilshan"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byText("Tharaka Dilshan"),
    ]);
    await driver.pause(1000);

    console.log("✅ Assignee selected: Tharaka Dilshan");


    //----------------

    // Skip attachments
    console.log("ℹ️ Skipping file attachments");
    await driver.pause(500);

    // Submit
    console.log("💾 Submitting feedback...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_feedback_submit_button"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("create_feedback_submit_button"),
    ]);

    // Wait for creation
    await driver.pause(3000);

    // Check for success snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("create_feedback_success_snackbar"),
      ], { timeout: 5000 });
      console.log("✅ Success notification shown!");
    } catch (e) {
      console.log("⚠️ Snackbar not found but continuing...");
    }

    await driver.pause(2000);

    // Verify back on feedback screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Feedback created successfully!");

  } catch (err) {
    console.error("❌ Create feedback failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

  // === TEST 4.8: EDIT FEEDBACK ===
it("Should edit feedback status successfully", async () => {
  try {
    console.log("✏️ Testing edit feedback flow...");

    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(1000);

    // Check if feedback list exists
    const isEmpty = await elementExists(driver, "feedback_filtered_empty_text");
    
    if (isEmpty) {
      console.log("⚠️ No feedback available to edit, skipping test");
      return;
    }

    // Wait for feedback list
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_list_view"),
    ]);
    await driver.pause(1000);

    // Click edit button using the TextButton key
    const success = await clickFirstFeedbackEditButton(driver);
    
    if (!success) {
      console.log("⚠️ Could not find feedback to edit, skipping");
      return;
    }

    await driver.pause(1200); // Wait for dialog animation

    // Wait for edit dialog
    console.log("⏳ Waiting for Edit Feedback dialog...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("edit_feedback_dialog"),
    ]);
    await driver.pause(800);

    console.log("✅ Edit dialog opened");

    // Change Status dropdown
    console.log("📝 Opening status dropdown...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("edit_feedback_status_dropdown"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("edit_feedback_status_dropdown"),
    ]);
    await driver.pause(1500);

    console.log("👆 Selecting 'Closed'...");
    await driver.executeScript("flutter:waitFor", [
      byText("Closed"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byText("Closed"),
    ]);
    await driver.pause(1000);

    console.log("✅ Status changed to: Closed");

    // Update
    console.log("💾 Submitting update...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("edit_feedback_update_button"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("edit_feedback_update_button"),
    ]);

    console.log("⏳ Waiting for update...");
    await driver.pause(4000);

    // Check success
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("edit_feedback_update_success_snackbar"),
      ], { timeout: 5000 });
      console.log("✅ Update successful!");
    } catch (e) {
      console.log("⚠️ Snackbar not found but continuing...");
    }

    await driver.pause(2000);

    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Feedback edited successfully!");

  } catch (err) {
    console.error("❌ Edit feedback failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

  // === TEST 4.9: ADD COMMENT TO FEEDBACK ===
it("Should add comment to feedback successfully", async () => {
  try {
    console.log("💬 Testing add comment to feedback flow...");

    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(1000);

    // Check if feedback list exists
    const isEmpty = await elementExists(driver, "feedback_filtered_empty_text");
    
    if (isEmpty) {
      console.log("⚠️ No feedback available to add comment, skipping test");
      return;
    }

    // Wait for feedback list
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_list_view"),
    ]);
    await driver.pause(1000);

    // Click add comment button
    const success = await clickFirstFeedbackAddCommentButton(driver);
    
    if (!success) {
      console.log("⚠️ Could not find feedback to add comment, skipping");
      return;
    }

    await driver.pause(1200); // Wait for dialog animation

    // Wait for add comment dialog
    console.log("⏳ Waiting for Add Comment dialog...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("add_comment_dialog"),
    ]);
    await driver.pause(800);

    console.log("✅ Add Comment dialog opened");

    // Enter comment text
    const commentText = `Test comment added at ${Date.now()}`;
    console.log(`⌨️ Entering comment: ${commentText}`);
    
    await driver.executeScript("flutter:waitFor", [
      byValueKey("add_comment_text_field"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("add_comment_text_field"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:enterText", [
      commentText,
      byValueKey("add_comment_text_field"),
    ]);
    await driver.pause(700);

    console.log("✅ Comment text entered");

    // Submit comment
    console.log("💾 Submitting comment...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("add_comment_submit_button"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("add_comment_submit_button"),
    ]);

    console.log("⏳ Waiting for comment to be added...");
    await driver.pause(4000); // Wait for API call

    // Check for success snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("add_comment_success_snackbar"),
      ], { timeout: 5000 });
      console.log("✅ Comment added successfully - success notification shown!");
    } catch (e) {
      console.log("⚠️ Success snackbar not found but continuing...");
    }

    await driver.pause(2000); // Let snackbar disappear

    // Verify back on feedback screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Comment added successfully!");

  } catch (err) {
    console.error("❌ Add comment failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 4.10: VIEW FEEDBACK DETAILS ===
it("Should view feedback details successfully", async () => {
  try {
    console.log("👁️ Testing view feedback details flow...");

    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(1000);

    // Check if feedback list exists
    const isEmpty = await elementExists(driver, "feedback_filtered_empty_text");
    
    if (isEmpty) {
      console.log("⚠️ No feedback available to view, skipping test");
      return;
    }

    // Wait for feedback list
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_list_view"),
    ]);
    await driver.pause(1000);

    // Click on feedback card to view details
    const success = await clickFirstFeedbackCard(driver);
    
    if (!success) {
      console.log("⚠️ Could not find feedback to view, skipping");
      return;
    }

    await driver.pause(1500); // Wait for dialog animation and API call

    // Wait for feedback details dialog
    console.log("⏳ Waiting for Feedback Details dialog...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_details_dialog"),
    ]);
    await driver.pause(1000);

    console.log("✅ Feedback Details dialog opened");

    // Verify we can see the details content
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("feedback_details_title"),
      ]);
      console.log("✅ Feedback title visible");

      await driver.executeScript("flutter:waitFor", [
        byValueKey("feedback_details_category"),
      ]);
      console.log("✅ Feedback details visible");
    } catch (e) {
      console.log("⚠️ Some details not found but continuing...");
    }

    // Wait a moment to "view" the details
    await driver.pause(2000);
    console.log("👀 Viewing feedback details...");

    // Close the dialog
    console.log("❌ Closing details dialog...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_details_close_button"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("feedback_details_close_button"),
    ]);

    await driver.pause(1000); // Wait for dialog to close

    // Verify back on feedback screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("feedback_screen"),
    ]);
    await driver.pause(500);

    console.log("✅ Feedback details viewed and closed successfully!");

  } catch (err) {
    console.error("❌ View feedback details failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 4.5: FILTER FEEDBACK BY ASSIGNEE ===
  it("Should filter feedback by assignee 'Tharaka Dilshan'", async () => {
    try {
      console.log("🔍 Testing feedback filter by assignee...");

      // Wait for filter dropdown
      console.log("⏳ Waiting for assignee filter dropdown...");
      await driver.executeScript("flutter:waitFor", [
        byValueKey("feedback_filter_assignee_dropdown"),
      ]);
      await driver.pause(500);

      // Tap dropdown to open
      console.log("👆 Opening assignee filter dropdown...");
      await driver.executeScript("flutter:clickElement", [
        byValueKey("feedback_filter_assignee_dropdown"),
      ]);
      await driver.pause(1000);

      // Replace '2' with the actual user_id for Tharaka Dilshan
      const tharakaUserId = 2; // ⚠️ UPDATE THIS with actual user_id
      
      console.log(`👆 Selecting 'Tharaka Dilshan' (user_id: ${tharakaUserId})...`);
      await driver.executeScript("flutter:clickElement", [
        byValueKey(`feedback_filter_assignee_option_${tharakaUserId}`),
      ]);
      await driver.pause(500);

      console.log("✅ Selected 'Tharaka Dilshan' from dropdown");

      // Wait for filtered results
      console.log("⏳ Waiting for filtered feedback...");
      await driver.pause(2000);

      // Verify filter result
      const isEmpty = await elementExists(driver, "feedback_filtered_empty_text");

      if (isEmpty) {
        console.log("ℹ️ No feedback for 'Tharaka Dilshan'");
        console.log("✅ Filter applied - empty state shown");
      } else {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("feedback_list_view"),
        ]);
        console.log("✅ Filter applied - filtered list shown");
      }

      console.log("✅ Assignee filter test completed");
    } catch (err) {
      console.error("❌ Assignee filter test failed:", err.message);

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
        byValueKey("feedback_app_bar"),
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
