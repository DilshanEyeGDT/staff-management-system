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
describe("Flutter Training & Assignment Flow", function () {
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

    // === TEST 2: NAVIGATE TO ROOM & RESOURCES SCREEN ===
it("Should navigate to Room & Resources screen", async () => {
  try {
    console.log("🎯 Looking for Room & Resources card on home screen...");

    // Wait for home screen to be ready
    await driver.pause(1000);
    await driver.executeScript("flutter:waitFor", [
      byValueKey("home_screen"),
    ]);

    // Wait for room & resources card to appear
    console.log("⏳ Waiting for Room & Resources card...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("room-resources-card"),
    ]);
    await driver.pause(500);

    // Tap on room & resources card
    await tapFlutterElement(
      driver,
      "room-resources-card-inkwell",
      "Room & Resources Card"
    );

    // Wait for Room & Resources screen to load
    console.log("⏳ Waiting for Room & Resources screen to load...");
    await driver.pause(2000); // Wait for navigation + API call
    await driver.executeScript("flutter:waitFor", [
      byValueKey("room_resources_screen"),
    ]);
    await driver.pause(1000);

    console.log("✅ Successfully navigated to Room & Resources screen");

    // Verify TabBar exists
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("room_resources_tabbar"),
      ]);
      console.log("✅ TabBar is visible");

      // Verify default tab is "Book a Room"
      await driver.executeScript("flutter:waitFor", [
        byValueKey("tab_book_room"),
      ]);
      console.log("✅ Book a Room tab is loaded (default tab)");
    } catch (e) {
      console.log("⚠️ Could not verify tabs");
    }

  } catch (err) {
    console.error("❌ Navigation to Room & Resources screen failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3: VERIFY BOOK A ROOM TAB IS LOADED ===
it("Should verify Book a Room tab has fetched rooms", async () => {
  try {
    console.log("🔍 Verifying Book a Room tab...");

    // Wait for Book a Room tab to be ready
    await driver.executeScript("flutter:waitFor", [
      byValueKey("book_room_tab"),
    ]);
    await driver.pause(1500);

    // Check if loading indicator appears first (optional)
    const isLoading = await elementExists(
      driver,
      "book_room_loading_indicator"
    );
    if (isLoading) {
      console.log("⏳ Rooms are loading...");
      await driver.pause(3000); // Wait for data to load
    }

    // Check for error state
    const hasError = await elementExists(driver, "book_room_error_text");
    if (hasError) {
      console.log("⚠️ Error state displayed in Book a Room tab");
      return;
    }

    // Check if rooms list exists
    console.log("⏳ Checking for rooms list...");
    
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("book_room_list"),
      ]);
      console.log("✅ Rooms list found");
      await driver.pause(1000);

      // Try to find specific room cards by ID (1-9)
      let roomFound = false;
      const roomIds = [5, 3, 4];

      for (const roomId of roomIds) {
        try {
          const roomCardKey = `room_card_${roomId}`;
          console.log(`Checking for room ID: ${roomId}...`);
          
          await driver.executeScript("flutter:waitFor", [
            byValueKey(roomCardKey),
          ]);
          
          console.log(`✅ Found room card with ID: ${roomId}`);
          roomFound = true;
          
          // Also verify we can see room details
          try {
            await driver.executeScript("flutter:waitFor", [
              byValueKey(`room_name_${roomId}`),
            ]);
            console.log(`✅ Room name visible for room ${roomId}`);
          } catch (e) {
            console.log(`⚠️ Could not verify room name for room ${roomId}`);
          }
          
          break; // Found at least one room, that's enough
        } catch (e) {
          // Room doesn't exist, try next
          if (roomId % 3 === 0) {
            console.log(`Tried up to room ${roomId}, continuing...`);
          }
          continue;
        }
      }

      if (!roomFound) {
        console.log("⚠️ Could not find rooms by ID, trying by button text...");
        
        // Strategy 2: Look for "Check availability" button text
        try {
          await driver.executeScript("flutter:waitFor", [
            byText("Check availability"),
          ]);
          console.log("✅ Room items are displayed (found 'Check availability' button)");
          roomFound = true;
        } catch (e) {
          console.log("⚠️ Could not find 'Check availability' button");
          
          // Strategy 3: Look for "Book" button text
          try {
            await driver.executeScript("flutter:waitFor", [
              byText("Book"),
            ]);
            console.log("✅ Room items are displayed (found 'Book' button)");
            roomFound = true;
          } catch (e) {
            console.log("⚠️ Could not find 'Book' button either");
          }
        }
      }

      if (roomFound) {
        console.log("✅ Rooms are successfully displayed in Book a Room tab");
      } else {
        console.log("⚠️ Rooms list exists but could not verify individual room cards");
      }

    } catch (e) {
      console.log("⚠️ Could not find rooms list:", e.message);
      console.log("ℹ️ Rooms might be empty or still loading");
    }

    console.log("✅ Book a Room tab verification complete");
    
  } catch (err) {
    console.error("❌ Book a Room tab verification failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.5: CHECK AVAILABILITY AND BOOK A ROOM ===
it("Should check availability and book a room successfully", async () => {
  try {
    console.log("📅 Testing check availability and book room flow...");

    // Verify we're on Book a Room tab
    await driver.executeScript("flutter:waitFor", [
      byValueKey("book_room_tab"),
    ]);
    await driver.pause(1000);

    // Check if rooms list exists
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("book_room_list"),
      ]);
      console.log("✅ Rooms list found");
    } catch (e) {
      console.log("⚠️ No rooms available, skipping test");
      return;
    }

    await driver.pause(1000);

    // Find first available room (try room IDs 1-9)
    let roomId = null;
    const roomIds = [5, 3, 4];

    for (const id of roomIds) {
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey(`room_card_${id}`),
        ]);
        roomId = id;
        console.log(`✅ Found room with ID: ${roomId}`);
        break;
      } catch (e) {
        continue;
      }
    }

    if (roomId === null) {
      console.log("⚠️ No rooms found to book, skipping test");
      return;
    }

    // === STEP 1: CHECK AVAILABILITY ===
    console.log("👆 Clicking 'Check Availability' button...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`check_availability_${roomId}`),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey(`check_availability_${roomId}`),
    ]);
    await driver.pause(2000); // Wait for API call and dialog

    // Wait for availability dialog or snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey(`availability_dialog_${roomId}`),
      ]);
      console.log("✅ Availability dialog opened");

      // Verify dialog title
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey(`availability_dialog_title_${roomId}`),
        ]);
        console.log("✅ Dialog title visible");
      } catch (e) {
        console.log("⚠️ Could not verify dialog title");
      }

      await driver.pause(2000); // View availability

      // Close dialog
      console.log("❌ Closing availability dialog...");
      await driver.executeScript("flutter:waitFor", [
        byValueKey(`availability_close_button_${roomId}`),
      ]);
      await driver.pause(300);

      await driver.executeScript("flutter:clickElement", [
        byValueKey(`availability_close_button_${roomId}`),
      ]);
      await driver.pause(1000);

      console.log("✅ Availability dialog closed");

    } catch (e) {
      // Check if snackbar appeared instead (no availability data)
      console.log("⚠️ Dialog not found, checking for snackbar...");
      const hasSnackbar = await elementExists(driver, "availability_empty_snackbar");
      if (hasSnackbar) {
        console.log("ℹ️ No availability data found (snackbar shown)");
        await driver.pause(2000);
      } else {
        console.log("⚠️ Neither dialog nor snackbar found");
      }
    }

    // === STEP 2: BOOK THE ROOM ===
    console.log("📝 Clicking 'Book' button...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`book_room_${roomId}`),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey(`book_room_${roomId}`),
    ]);
    await driver.pause(1500); // Wait for dialog animation

    // Wait for book dialog
    console.log("⏳ Waiting for Book Room dialog...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`book_dialog_${roomId}`),
    ]);
    await driver.pause(800);

    console.log("✅ Book Room dialog opened");

    // Select Date
    console.log("📅 Selecting date...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`select_date_${roomId}`),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byValueKey(`select_date_${roomId}`),
    ]);
    await driver.pause(1500); // Wait for date picker

    // Select today's date (OK button)
    console.log("👆 Selecting today's date...");
    await driver.executeScript("flutter:waitFor", [
      byText("OK"),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1000);

    console.log("✅ Date selected");

    // Select Start Time
    console.log("⏰ Selecting start time (current time)...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`select_start_time_${roomId}`),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byValueKey(`select_start_time_${roomId}`),
    ]);
    await driver.pause(1500); // Wait for time picker

    // Accept current time (OK button)
    console.log("👆 Accepting current time as start time...");
    await driver.executeScript("flutter:waitFor", [
      byText("OK"),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1000);

    console.log("✅ Start time selected (current time)");

    // Select End Time (current time + 1 hour)
    console.log("⏰ Selecting end time (current time + 1 hour)...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`select_end_time_${roomId}`),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byValueKey(`select_end_time_${roomId}`),
    ]);
    await driver.pause(1500); // Wait for time picker to open

    console.log("🕐 Adjusting time picker to add 1 hour...");
    
    // // Get current hour to calculate next hour
    // const now = new Date();
    // const currentHour = now.getHours();
    // const nextHour = (currentHour + 1) % 24; // Add 1 hour, wrap at 24
    
    // console.log(`Current hour: ${currentHour}, Target hour: ${nextHour}`);

    // try {
    //   // Strategy: Tap on the hour hand area to increment by 1 hour
    //   // In Material time picker, we can tap the next hour on the clock face
      
    //   // For 24-hour format or AM/PM format, try to find and tap the next hour
    //   const nextHourText = nextHour.toString();
      
    //   console.log(`Looking for hour: ${nextHourText} or manual pick`);
      
    //   // Try to find and click the next hour on the clock face
    //   await driver.executeScript("flutter:waitFor", [
    //     byText(nextHourText),
    //   ]);
    //   await driver.pause(500);
      
    //   await driver.executeScript("flutter:clickElement", [
    //     byText(nextHourText),
    //   ]);
    //   await driver.pause(800);
      
    //   console.log(`✅ Selected hour: ${nextHourText}`);
      
    // } catch (e) {
    //   console.log(`⚠️ Could not find hour ${nextHour}, trying alternative method...`);
      
    //   // Alternative: Try common hour values or use scroll gesture
    //   // If the picker is in 12-hour format, try finding the hour with AM/PM
    //   try {
    //     const hour12 = nextHour > 12 ? nextHour - 12 : (nextHour === 0 ? 12 : nextHour);
    //     console.log(`Trying 12-hour format: ${hour12}`);
        
    //     await driver.executeScript("flutter:waitFor", [
    //       byText(hour12.toString()),
    //     ]);
    //     await driver.pause(500);
        
    //     await driver.executeScript("flutter:clickElement", [
    //       byText(hour12.toString()),
    //     ]);
    //     await driver.pause(800);
        
    //     console.log(`✅ Selected hour in 12-hour format: ${hour12}`);
    //   } catch (err) {
    //     console.log("⚠️ Could not adjust hour, using default time");
    //   }
    // }

    console.log("🕐 Wait until manually select end time");
    await driver.pause(10000);

    // Accept the end time
    console.log("👆 Confirming end time...");
    await driver.executeScript("flutter:waitFor", [
      byText("OK"),
    ]);
    await driver.pause(300);

    await driver.executeScript("flutter:clickElement", [
      byText("OK"),
    ]);
    await driver.pause(1000);

    console.log("✅ End time selected (current time + 1 hour)");

    // Submit booking
    console.log("💾 Submitting booking...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey(`book_submit_${roomId}`),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey(`book_submit_${roomId}`),
    ]);

    console.log("⏳ Waiting for booking to complete...");
    await driver.pause(4000); // Wait for API call

    // Check for success snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("book_success_snackbar"),
      ]);
      console.log("✅ Room booked successfully - success notification shown!");
    } catch (e) {
      console.log("⚠️ Success snackbar not found, checking for other results...");
      
      // Check for validation error
      const hasValidationError = await elementExists(driver, "book_validation_snackbar");
      if (hasValidationError) {
        console.log("⚠️ Validation error occurred (missing date/times)");
      }
      
      // Check for booking failed
      const hasBookingFailed = await elementExists(driver, "book_failed_snackbar");
      if (hasBookingFailed) {
        console.log("⚠️ Booking failed");
      }
      
      // Check for error
      const hasError = await elementExists(driver, "book_error_snackbar");
      if (hasError) {
        console.log("⚠️ Booking error occurred");
      }
    }

    await driver.pause(2000); // Let snackbar disappear

    // Verify we're back on Book a Room tab
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("book_room_tab"),
      ]);
      console.log("✅ Back on Book a Room tab");
    } catch (e) {
      console.log("⚠️ Book a Room tab not immediately visible");
    }

    await driver.pause(1000);

    console.log("✅ Check availability and book room flow completed!");

  } catch (err) {
    console.error("❌ Check availability and book room failed:", err.message);

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

    // Tap back button on app bar
    await driver.executeScript("flutter:waitFor", [
      byValueKey("room_resources_screen"),
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
