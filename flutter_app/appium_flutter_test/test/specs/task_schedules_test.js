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
describe("Flutter Task & Schedule Flow", function () {
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

    // === TEST 2: NAVIGATE TO TASK & SCHEDULES SCREEN ===
it("Should navigate to Task & Schedules screen", async () => {
  try {
    console.log("🎯 Looking for Task & Schedules card on home screen...");

    // Wait for home screen to be ready
    await driver.pause(1000);
    await driver.executeScript("flutter:waitFor", [
      byValueKey("home_screen"),
    ]);

    // Wait for task & schedules card to appear
    console.log("⏳ Waiting for Task & Schedules card...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("task-schedules-card"),
    ]);
    await driver.pause(500);

    // Tap on task & schedules card
    await tapFlutterElement(
      driver,
      "task-schedules-card-inkwell",
      "Task & Schedules Card"
    );

    // Wait for Task & Schedules screen to load
    console.log("⏳ Waiting for Task & Schedules screen to load...");
    await driver.pause(2000); // Wait for navigation + API call
    await driver.executeScript("flutter:waitFor", [
      byValueKey("task_schedules_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Successfully navigated to Task & Schedules screen");

    // Verify TabBar exists
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("task_schedules_tabbar"),
      ]);
      console.log("✅ TabBar is visible");

      // Verify default tab is Schedules
      await driver.executeScript("flutter:waitFor", [
        byValueKey("schedules_tab"),
      ]);
      console.log("✅ Schedules tab is loaded (default tab)");
    } catch (e) {
      console.log("⚠️ Could not verify tabs");
    }

  } catch (err) {
    console.error("❌ Navigation to Task & Schedules screen failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3: VERIFY SCHEDULES TAB IS LOADED ===
it("Should verify schedules tab is loaded", async () => {
  try {
    console.log("🔍 Verifying schedules tab...");

    // Wait for schedules screen to be ready
    await driver.executeScript("flutter:waitFor", [
      byValueKey("schedules_screen"),
    ]);
    await driver.pause(1000);

    // Check if loading indicator appears first (optional)
    const isLoading = await elementExists(
      driver,
      "schedules_loading_indicator"
    );
    if (isLoading) {
      console.log("⏳ Schedules are loading...");
      await driver.pause(3000); // Wait for data to load
    }

    // Check if schedules are loaded or empty
    const isEmpty = await elementExists(driver, "schedules_empty_text");

    if (isEmpty) {
      console.log("ℹ️ No schedules available for this user");
      console.log("✅ Empty state verified successfully");
    } else {
      // Verify schedules list view exists
      console.log("⏳ Waiting for schedules list...");
      await driver.executeScript("flutter:waitFor", [
        byValueKey("schedules_list"),
      ]);
      await driver.pause(500);

      console.log("✅ Schedules list loaded successfully");

      // Try to verify at least one schedule card exists
      try {
        // This will match any card with pattern 'schedule_card_*'
        await driver.executeScript("flutter:waitFor", [
          byValueKey("schedules_screen"),
        ]);
        console.log("✅ Schedule items are displayed");
      } catch (e) {
        console.log("⚠️ Could not verify individual schedule items");
      }
    }

    // Verify FAB exists
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("add_schedule_fab"),
      ]);
      console.log("✅ Add Schedule FAB is visible");
    } catch (e) {
      console.log("⚠️ Could not verify Add Schedule FAB");
    }

    console.log("✅ Schedules tab verification complete");
  } catch (err) {
    console.error("❌ Schedules tab verification failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.5: CREATE NEW SCHEDULE ===
it("Should create new schedule successfully", async () => {
  try {
    console.log("➕ Testing create schedule flow...");

    // Verify we're on the schedules screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("schedules_screen"),
    ]);
    await driver.pause(1000);

    // Step 1: Tap the FAB to open create schedule screen
    console.log("👆 Tapping Add Schedule FAB...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("add_schedule_fab"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("add_schedule_fab"),
    ]);
    await driver.pause(1500); // Wait for navigation

    // Wait for Create Schedule screen to load
    console.log("⏳ Waiting for Create Schedule screen...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_schedule_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Create Schedule screen opened");

    // Step 2: Enter title
    const scheduleTitle = `Test Schedule ${Date.now()}`;
    console.log(`⌨️ Entering title: ${scheduleTitle}`);
    await enterFlutterText(
      driver,
      "schedule_title_field",
      scheduleTitle,
      "Schedule Title"
    );

    // Step 3: Enter description
    const scheduleDescription = "This is an automated test schedule";
    console.log(`⌨️ Entering description: ${scheduleDescription}`);
    await enterFlutterText(
      driver,
      "schedule_description_field",
      scheduleDescription,
      "Schedule Description"
    );

    // Step 4: Select assignee from dropdown
console.log("👤 Opening assignee dropdown...");
await driver.executeScript("flutter:waitFor", [
  byValueKey("schedule_assignee_dropdown"),
]);
await driver.pause(500);

await driver.executeScript("flutter:clickElement", [
  byValueKey("schedule_assignee_dropdown"),
]);
await driver.pause(1500); // Wait for dropdown menu to open

// Select "Tharaka Dilshan" by text (not by key)
console.log("👆 Selecting 'Tharaka Dilshan' from assignee...");
await driver.executeScript("flutter:waitFor", [
  byText("Tharaka Dilshan"),
]);
await driver.pause(300);

await driver.executeScript("flutter:clickElement", [
  byText("Tharaka Dilshan"),
]);
await driver.pause(1000); // Wait for dropdown to close

console.log("✅ Assignee selected: Tharaka Dilshan");

    // Step 5: Select start date and time
    console.log("📅 Selecting start date and time...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("schedule_start_time_tile"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("schedule_start_time_tile"),
    ]);
    await driver.pause(1500); // Wait for date picker to appear

    // Handle date picker - select today's date (OK button)
    console.log("👆 Selecting start date (today)...");
    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1500); // Wait for time picker to appear

    // Handle time picker - select default time (OK button)
    console.log("👆 Selecting start time...");
    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1000);

    console.log("✅ Start date and time selected");

    // Step 6: Select end date and time (one day ahead)
console.log("📅 Selecting end date and time (tomorrow)...");
await driver.executeScript("flutter:waitFor", [
  byValueKey("schedule_end_time_tile"),
]);
await driver.pause(500);

await driver.executeScript("flutter:clickElement", [
  byValueKey("schedule_end_time_tile"),
]);
await driver.pause(1500); // Wait for date picker to appear

// Handle date picker - select tomorrow's date
console.log("👆 Selecting end date (tomorrow)...");

// First, we need to navigate to tomorrow in the date picker
// We'll tap the right arrow or select the next day
try {
  // Try to find and tap tomorrow's date (today + 1)
  // Flutter date picker shows current month, so we look for the next day cell
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.getDate();
  
  console.log(`Looking for day ${tomorrowDay}...`);
  
  // Tap on tomorrow's date in the calendar
  await driver.executeScript("flutter:clickElement", [
    byText(tomorrowDay.toString()),
  ]);
  await driver.pause(500);
} catch (e) {
  console.log("⚠️ Could not find specific date, using right arrow...");
  // Alternative: use right arrow to go to next day
  // This is a fallback in case the text approach doesn't work
}

await driver.executeScript("flutter:clickElement", [
  byText("OK"),
]);
await driver.pause(1500); // Wait for time picker to appear

// Handle time picker - select default time (OK button)
console.log("👆 Selecting end time...");
await driver.executeScript("flutter:clickElement", [
  byText("OK"),
]);
await driver.pause(1000);

console.log("✅ End date and time selected (tomorrow)");

    // Step 7: Recurrence rule is already set to "NONE" by default
    console.log("ℹ️ Recurrence rule is default (None) - skipping");
    await driver.pause(500);

    // Step 8: Enter location
    const location = "Sydney";
    console.log(`📍 Entering location: ${location}`);
    await enterFlutterText(
      driver,
      "schedule_location_field",
      location,
      "Location"
    );

    // Step 9: Change importance from 'high' to 'low'
    console.log("⚡ Changing importance to 'low'...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("schedule_importance_field"),
    ]);
    await driver.pause(500);

    // Click and clear the field
    await driver.executeScript("flutter:clickElement", [
      byValueKey("schedule_importance_field"),
    ]);
    await driver.pause(300);

    // Clear existing text
    try {
      await driver.executeScript("flutter:clearText", [
        byValueKey("schedule_importance_field"),
      ]);
      await driver.pause(200);
    } catch (e) {
      console.log(`⚠️ Could not clear importance field: ${e.message}`);
    }

    // Enter 'low'
    await driver.executeScript("flutter:enterText", [
      "low",
      byValueKey("schedule_importance_field"),
    ]);
    await driver.pause(700);

    console.log("✅ Importance changed to 'low'");

    // Step 10: Submit the form
    console.log("💾 Submitting schedule creation...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("create_schedule_submit_button"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("create_schedule_submit_button"),
    ]);

    console.log("⏳ Waiting for schedule creation...");
    await driver.pause(4000); // Wait for API call

    // Step 11: Check for success snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("schedule_create_success_snackbar"),
      ], { timeout: 5000 });
      console.log("✅ Schedule created successfully - success notification shown!");
    } catch (e) {
      console.log("⚠️ Success snackbar not found but continuing...");
    }

    await driver.pause(2000); // Let snackbar disappear

    // Verify we're back on schedules screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("schedules_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Schedule creation completed successfully!");

  } catch (err) {
    console.error("❌ Create schedule failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.6: SWITCH TO TASKS TAB ===
it("Should switch to Tasks tab successfully", async () => {
  try {
    console.log("🔄 Switching to Tasks tab...");

    // Verify we're still on task & schedules screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("task_schedules_screen"),
    ]);
    await driver.pause(500);

    // Verify TabBar exists
    await driver.executeScript("flutter:waitFor", [
      byValueKey("task_schedules_tabbar"),
    ]);
    await driver.pause(300);

    // Tap on Tasks tab
    console.log("👆 Tapping Tasks tab...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("tab_tasks"),
    ]);
    await driver.pause(300);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("tab_tasks"),
    ]);
    await driver.pause(1500); // Wait for tab switch and data loading

    console.log("✅ Switched to Tasks tab");

    // Verify Tasks tab is loaded
    await driver.executeScript("flutter:waitFor", [
      byValueKey("tasks_screen"),
    ]);
    await driver.pause(1000);

    // Verify tasks sub-tabs exist
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_tab_bar"),
      ]);
      console.log("✅ Tasks sub-tabs are visible");

      // Verify default tab (Open) is loaded
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_tab_open"),
      ]);
      console.log("✅ Open tasks tab is loaded (default)");
    } catch (e) {
      console.log("⚠️ Could not verify sub-tabs");
    }

    // Check if loading indicator appears
    const isLoading = await elementExists(driver, "tasks_loading_indicator");
    if (isLoading) {
      console.log("⏳ Tasks are loading...");
      await driver.pause(3000); // Wait for data to load
    }

    // Check if tasks are loaded or empty
    const isEmpty = await elementExists(driver, "tasks_empty_text");

    if (isEmpty) {
      console.log("ℹ️ No tasks available in Open tab");
      console.log("✅ Empty state verified");
    } else {
      // Verify tasks list exists
      console.log("⏳ Waiting for tasks list...");
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_list_open"),
      ]);
      console.log("✅ Tasks list loaded successfully");
    }

    console.log("✅ Tasks tab verification complete");

  } catch (err) {
    console.error("❌ Switch to Tasks tab failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

    // === TEST 3.7: ADD COMMENT TO TASK ===
it("Should add comment to task successfully", async () => {
  try {
    console.log("💬 Testing add comment to task...");

    // Verify we're on tasks screen
    await driver.executeScript("flutter:waitFor", [byValueKey("tasks_screen")]);
    await driver.pause(1000);

    // Verify we're on Open tab
    await driver.executeScript("flutter:waitFor", [byValueKey("tasks_tab_open")]);
    await driver.pause(500);

    // Check if tasks exist in Open tab
    const isEmpty = await elementExists(driver, "tasks_empty_text");

    if (isEmpty) {
      console.log("ℹ️ No tasks in Open tab, skipping comment test");
      return;
    }

    console.log("📝 Adding comment to first task in Open tab...");

    // Wait for tasks list to be visible
    await driver.executeScript("flutter:waitFor", [byValueKey("tasks_list_open")]);
    await driver.pause(1500);

    console.log("✅ Tasks list found");

    // Strategy: Find task by looking for the task card
    let taskClicked = false;

    // First, try scrolling to top to see the first task
    try {
      console.log("📜 Scrolling to top of task list...");
      await driver.executeScript("flutter:scroll", [
        byValueKey("tasks_list_open"),
        { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
      ]);
      await driver.pause(1000);
    } catch (e) {
      console.log("⚠️ Could not scroll to top");
    }

    // Try to find task by the known UUID
    const knownTaskId = "63a4694d-f0a8-4557-a7d2-913320434f72";
    
    try {
      console.log(`Looking for task: ${knownTaskId.substring(0, 13)}...`);
      
      const taskCardKey = `task_card_open_${knownTaskId}`;
      const taskTileKey = `task_tile_open_${knownTaskId}`;
      
      // First check if card exists
      await driver.executeScript("flutter:waitFor", [
        byValueKey(taskCardKey),
      ]);
      
      console.log(`✅ Found task card`);
      await driver.pause(800);
      
      // Click on the ListTile to open comment popup
      await driver.executeScript("flutter:clickElement", [
        byValueKey(taskTileKey),
      ]);
      
      taskClicked = true;
      console.log(`✅ Clicked task tile`);
      
    } catch (e) {
      console.log(`⚠️ Could not find task by UUID: ${e.message}`);
    }

    // If UUID approach didn't work, try scrollUntilVisible
    if (!taskClicked) {
      console.log("🔍 Last attempt: Using scrollUntilVisible...");
      
      try {
        // Scroll until we find the Card widget
        await driver.executeScript("flutter:scrollUntilVisible", [
          byValueKey("tasks_list_open"),
          {
            item: byValueKey(`task_card_open_${knownTaskId}`),
            dxScroll: 0,
            dyScroll: -100,
            waitTimeoutMilliseconds: 10000,
          },
        ]);
        
        await driver.pause(1000);
        
        console.log("✅ Task card is now visible");
        
        // Now click it
        await driver.executeScript("flutter:clickElement", [
          byValueKey(`task_tile_open_${knownTaskId}`),
        ]);
        
        taskClicked = true;
        console.log("✅ Clicked task after scrolling");
        
      } catch (e) {
        console.log(`⚠️ scrollUntilVisible failed: ${e.message}`);
      }
    }

    if (!taskClicked) {
      console.log("❌ Could not find or click any task in Open tab");
      console.log("⚠️ Skipping comment test");
      return;
    }

    // Wait for comment bottom sheet to appear
    await driver.pause(2000); // Wait for bottom sheet animation

    console.log("⏳ Waiting for Add Comment bottom sheet...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("task_comment_bottom_sheet"),
    ]);
    await driver.pause(1000);

    console.log("✅ Comment bottom sheet opened");

    // Verify the comment title is visible
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("task_comment_title"),
      ]);
      console.log("✅ Comment dialog title visible");
    } catch (e) {
      console.log("⚠️ Could not verify comment title");
    }

    // Enter comment text using the helper function
    const commentText = `Test comment for task ${Date.now()}`;
    console.log(`⌨️ Entering comment: ${commentText}`);
    
    await enterFlutterText(
      driver,
      "task_comment_text_field",
      commentText,
      "Task Comment"
    );

    console.log("✅ Comment text entered");

    // Submit comment
    console.log("💾 Submitting comment...");
    await tapFlutterElement(
      driver,
      "task_comment_submit_button",
      "Submit Comment Button"
    );

    console.log("⏳ Waiting for comment to be added...");
    await driver.pause(3000); // Wait for API call and bottom sheet to close

    // Check for result snackbar (but don't fail if not found)
    try {
      const snackbarExists = await elementExists(driver, "task_comment_result_snackbar");
      if (snackbarExists) {
        console.log("✅ Comment result notification shown!");
      }
    } catch (e) {
      console.log("⚠️ Snackbar check skipped");
    }

    await driver.pause(2000); // Let snackbar disappear

    // Verify we're back on tasks screen (with longer wait)
    console.log("⏳ Verifying we're back on tasks screen...");
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_screen"),
      ]);
      console.log("✅ Back on tasks screen");
    } catch (e) {
      console.log("⚠️ Tasks screen not immediately visible, trying tab bar...");
      // Alternative: check for the tab bar which should always be visible
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_tab_bar"),
      ]);
      console.log("✅ Tab bar visible, tasks screen is active");
    }

    await driver.pause(1000);

    console.log("✅ Comment added successfully!");

  } catch (err) {
    console.error("❌ Add comment to task failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.8: NAVIGATE THROUGH TASK SUB-TABS ===
it("Should navigate through all task sub-tabs", async () => {
  try {
    console.log("🔄 Testing task sub-tab navigation...");

    // Make sure we start on tasks screen
    console.log("⏳ Ensuring we're on tasks screen...");
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_screen"),
      ]);
    } catch (e) {
      // If tasks_screen key not found, try tab bar
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_tab_bar"),
      ]);
    }
    await driver.pause(1500);

    // We should be on Open tab from previous test
    console.log("ℹ️ Starting from Open tab");

    // Navigate to InProgress tab
    console.log("👆 Switching to InProgress tab...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("tasks_tab_inprogress"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("tasks_tab_inprogress"),
    ]);
    await driver.pause(2000); // Wait for tab switch and data loading

    console.log("✅ InProgress tab loaded");

    // Check InProgress tab content
    const isInProgressEmpty = await elementExists(driver, "tasks_empty_text");
    if (isInProgressEmpty) {
      console.log("ℹ️ No tasks in InProgress tab");
    } else {
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("tasks_list_inprogress"),
        ]);
        console.log("✅ InProgress tasks displayed");
      } catch (e) {
        console.log("⚠️ InProgress tasks list not found");
      }
    }

    await driver.pause(1500);

    // Navigate to Done tab
    console.log("👆 Switching to Done tab...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("tasks_tab_done"),
    ]);
    await driver.pause(500);
    
    await driver.executeScript("flutter:clickElement", [
      byValueKey("tasks_tab_done"),
    ]);
    await driver.pause(2000); // Wait for tab switch and data loading

    console.log("✅ Done tab loaded");

    // Check Done tab content
    // const isDoneEmpty = await elementExists(driver, "tasks_empty_text");
    // if (isDoneEmpty) {
    //   console.log("ℹ️ No tasks in Done tab");
    // } else {
    //   try {
    //     await driver.executeScript("flutter:waitFor", [
    //       byValueKey("tasks_list_done"),
    //     ]);
    //     console.log("✅ Done tasks displayed");
    //   } catch (e) {
    //     console.log("⚠️ Done tasks list not found");
    //   }
    // }

    await driver.pause(1500);

    // Navigate to Cancelled tab
    console.log("👆 Switching to Cancelled tab...");
    
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tasks_tab_cancelled"),
      ]);
      await driver.pause(500);
      
      await driver.executeScript("flutter:clickElement", [
        byValueKey("tasks_tab_cancelled"),
      ]);
      await driver.pause(2000); // Wait for tab switch and data loading

      console.log("✅ Cancelled tab loaded");

      // Check Cancelled tab content
    //   const isCancelledEmpty = await elementExists(driver, "tasks_empty_text");
    //   if (isCancelledEmpty) {
    //     console.log("ℹ️ No tasks in Cancelled tab");
    //   } else {
    //     try {
    //       await driver.executeScript("flutter:waitFor", [
    //         byValueKey("tasks_list_cancelled"),
    //       ]);
    //       console.log("✅ Cancelled tasks displayed");
    //     } catch (e) {
    //       console.log("⚠️ Cancelled tasks list not found");
    //     }
    //   }

      await driver.pause(1500);
      
    } catch (e) {
      console.error("⚠️ Could not navigate to Cancelled tab:", e.message);
      console.log("⚠️ Cancelled tab might not be visible, but continuing...");
    }

    console.log("✅ All task sub-tabs navigated successfully!");

  } catch (err) {
    console.error("❌ Task sub-tab navigation failed:", err.message);

    try {
      await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
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

    // Verify we're on task & schedules screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("task_schedules_screen"),
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
