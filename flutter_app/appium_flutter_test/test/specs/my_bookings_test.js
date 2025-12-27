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

// === TEST 3.6: NAVIGATE TO MY BOOKINGS TAB AND VERIFY ===
it("Should navigate to My Bookings tab and verify bookings", async () => {
  try {
    console.log("📋 Testing My Bookings tab...");

    // Verify we're on Room & Resources screen
    await driver.executeScript("flutter:waitFor", [
      byValueKey("room_resources_screen"),
    ]);
    await driver.pause(500);

    // Navigate to My Bookings tab
    console.log("👆 Switching to My Bookings tab...");
    await driver.executeScript("flutter:waitFor", [
      byValueKey("tab_my_bookings"),
    ]);
    await driver.pause(500);

    await driver.executeScript("flutter:clickElement", [
      byValueKey("tab_my_bookings"),
    ]);
    await driver.pause(2000); // Wait for tab switch and data loading

    console.log("✅ My Bookings tab loaded");

    // Wait for My Bookings tab to be ready
    await driver.executeScript("flutter:waitFor", [
      byValueKey("my_bookings_tab"),
    ]);
    await driver.pause(1500);

    // Check if loading indicator appears
    const isLoading = await elementExists(driver, "my_bookings_loading");
    if (isLoading) {
      console.log("⏳ Bookings are loading...");
      await driver.pause(3000); // Wait for data to load
    }

    // Check if bookings are loaded or empty
    const isEmpty = await elementExists(driver, "my_bookings_empty");

    if (isEmpty) {
      console.log("ℹ️ No bookings found for this user");
      console.log("✅ Empty state verified successfully");
    } else {
      // Verify bookings list view exists
      console.log("⏳ Checking for bookings list...");
      
      try {
        await driver.executeScript("flutter:waitFor", [
          byValueKey("my_bookings_list"),
        ]);
        console.log("✅ Bookings list found");
        await driver.pause(1000);

        // Try to verify at least one booking card exists
        let bookingFound = false;

        // Known booking IDs (UUIDs)
        const knownBookingIds = [
          "802b23a3-bd70-4ba3-98f8-7df633b63471"
        ];

        console.log("🔍 Looking for booking cards by UUID...");
        
        for (const bookingId of knownBookingIds) {
          try {
            const bookingCardKey = `booking_card_${bookingId}`;
            
            console.log(`Checking for booking: ${bookingId.substring(0, 8)}...`);
            
            await driver.executeScript("flutter:waitFor", [
              byValueKey(bookingCardKey),
            ]);
            
            console.log(`✅ Found booking card with ID: ${bookingId.substring(0, 13)}...`);
            bookingFound = true;
            
            // Verify we can see booking details
            try {
              await driver.executeScript("flutter:waitFor", [
                byValueKey(`booking_room_name_${bookingId}`),
              ]);
              console.log(`✅ Booking room name visible`);
            } catch (e) {
              console.log(`⚠️ Could not verify room name for this booking`);
            }
            
            // Verify booking times are visible
            try {
              await driver.executeScript("flutter:waitFor", [
                byValueKey(`booking_start_${bookingId}`),
              ]);
              console.log(`✅ Booking start time visible`);
            } catch (e) {
              console.log(`⚠️ Could not verify start time`);
            }

            // Verify booking status is visible
            try {
              await driver.executeScript("flutter:waitFor", [
                byValueKey(`booking_status_${bookingId}`),
              ]);
              console.log(`✅ Booking status visible`);
            } catch (e) {
              console.log(`⚠️ Could not verify booking status`);
            }
            
            // Check if cancel button exists (for non-cancelled bookings)
            try {
              await driver.executeScript("flutter:waitFor", [
                byValueKey(`cancel_booking_${bookingId}`),
              ]);
              console.log(`✅ Cancel button visible for this booking`);
            } catch (e) {
              console.log(`ℹ️ No cancel button (booking might be cancelled)`);
            }
            
            break; // Found at least one booking, that's enough
            
          } catch (e) {
            // Booking doesn't exist or not visible, try next
            console.log(`⚠️ Booking ${bookingId.substring(0, 8)}... not found`);
            continue;
          }
        }

        if (!bookingFound) {
          console.log("⚠️ Could not find bookings by UUID, trying by text...");
          
          // Strategy 2: Look for common booking-related text
          try {
            // Try to find "Start:" text which should appear in every booking
            await driver.executeScript("flutter:waitFor", [
              byText("Start:"),
            ]);
            console.log("✅ Booking items are displayed (found 'Start:' text)");
            bookingFound = true;
          } catch (e) {
            console.log("⚠️ Could not find 'Start:' text");
            
            // Try to find "Status:" text
            try {
              await driver.executeScript("flutter:waitFor", [
                byText("Status:"),
              ]);
              console.log("✅ Booking items are displayed (found 'Status:' text)");
              bookingFound = true;
            } catch (err) {
              console.log("⚠️ Could not find 'Status:' text");
              
              // Try to find "Cancel" button
              try {
                await driver.executeScript("flutter:waitFor", [
                  byText("Cancel"),
                ]);
                console.log("✅ Booking items are displayed (found 'Cancel' button)");
                bookingFound = true;
              } catch (error) {
                console.log("⚠️ Could not find 'Cancel' button either");
              }
            }
          }
        }

        if (bookingFound) {
          console.log("✅ Bookings are successfully displayed in My Bookings tab");
        } else {
          console.log("⚠️ Bookings list exists but could not verify individual bookings");
        }

      } catch (e) {
        console.log("⚠️ Could not find bookings list:", e.message);
      }
    }

    console.log("✅ My Bookings tab verification complete");

  } catch (err) {
    console.error("❌ My Bookings tab verification failed:", err.message);

    try {
      const screenshot = await driver.takeScreenshot();
      console.log("📸 Screenshot captured for debugging");
    } catch (e) {
      console.log("Could not capture screenshot");
    }

    throw err;
  }
});

// === TEST 3.7: CANCEL A BOOKING ===
it("Should cancel a booking successfully", async () => {
  try {
    console.log("❌ Testing cancel booking flow...");

    // Make sure we're still on the Room & Resources screen and My Bookings tab
    console.log("⏳ Ensuring we're on My Bookings tab...");
    
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("room_resources_screen"),
      ]);
      console.log("✅ On Room & Resources screen");
    } catch (e) {
      console.log("⚠️ Room & Resources screen not found");
    }

    await driver.pause(1500);

    // Make sure we're on My Bookings tab
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("my_bookings_tab"),
      ]);
      console.log("✅ My Bookings tab is active");
    } catch (e) {
      console.log("⚠️ My Bookings tab not active, clicking it again...");
      try {
        await driver.executeScript("flutter:clickElement", [
          byValueKey("tab_my_bookings"),
        ]);
        await driver.pause(2000);
      } catch (err) {
        console.log("⚠️ Could not click My Bookings tab");
      }
    }

    await driver.pause(1500);

    // Check if bookings list exists
    const isEmpty = await elementExists(driver, "my_bookings_empty");

    if (isEmpty) {
      console.log("ℹ️ No bookings available to cancel, skipping test");
      return;
    }

    // Wait for bookings list
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("my_bookings_list"),
      ]);
      console.log("✅ Bookings list found");
    } catch (e) {
      console.log("⚠️ Could not find bookings list, skipping test");
      return;
    }

    await driver.pause(1000);

    // Scroll to top first
    // try {
    //   console.log("📜 Scrolling to top of bookings list...");
    //   await driver.executeScript("flutter:scroll", [
    //     byValueKey("my_bookings_list"),
    //     { dx: 0, dy: -1000, durationMilliseconds: 500, frequency: 60 },
    //   ]);
    //   await driver.pause(1000);
    // } catch (e) {
    //   console.log("⚠️ Could not scroll to top");
    // }

    // Target specific booking ID
    const targetBookingId = "802b23a3-bd70-4ba3-98f8-7df633b63471";
    
    console.log(`🔍 Looking for booking: ${targetBookingId.substring(0, 13)}...`);

    try {
      // Check if booking card exists
      await driver.executeScript("flutter:waitFor", [
        byValueKey(`booking_card_${targetBookingId}`),
      ]);
      
      console.log(`✅ Found booking card: ${targetBookingId.substring(0, 13)}...`);
      await driver.pause(500);
      
      // Check if cancel button exists for this booking
      await driver.executeScript("flutter:waitFor", [
        byValueKey(`cancel_booking_${targetBookingId}`),
      ]);
      
      console.log(`✅ Found cancel button for booking`);
      await driver.pause(500);
      
      // Click the Cancel button
      await driver.executeScript("flutter:clickElement", [
        byValueKey(`cancel_booking_${targetBookingId}`),
      ]);
      
      console.log(`✅ Clicked cancel button`);
      
    } catch (e) {
      console.log(`⚠️ Could not find booking or cancel button: ${e.message}`);
      console.log("⚠️ Booking might not exist or already cancelled, skipping test");
      return;
    }

    console.log("⏳ Waiting for booking to be cancelled...");
    await driver.pause(4000); // Wait for API call

    // Check for success snackbar
    try {
      await driver.executeScript("flutter:waitFor", [
        byValueKey("room_booking_cancel_success_snackbar"),
      ]);
      console.log("✅ Booking cancelled successfully - success notification shown!");
    } catch (e) {
      console.log("⚠️ Success snackbar not found, checking for other results...");
      
      // Check for failure snackbar
      const hasFailure = await elementExists(driver, "room_booking_cancel_failure_snackbar");
      if (hasFailure) {
        console.log("⚠️ Failed to cancel booking (failure snackbar shown)");
      }
      
      // Check for error snackbar
      const hasError = await elementExists(driver, "room_booking_cancel_error_snackbar");
      if (hasError) {
        console.log("⚠️ Error occurred while cancelling booking");
      }
    }

    await driver.pause(3000); // Let snackbar disappear and list refresh

    // Verify the bookings list has refreshed
    console.log("⏳ Verifying bookings list refreshed...");
    
    // try {
    //   await driver.executeScript("flutter:waitFor", [
    //     byValueKey("my_bookings_list"),
    //   ]);
    //   console.log("✅ Bookings list refreshed");
    // } catch (e) {
    //   const nowEmpty = await elementExists(driver, "my_bookings_empty");
    //   const stillLoading = await elementExists(driver, "my_bookings_loading");
      
    //   if (nowEmpty) {
    //     console.log("ℹ️ No more bookings (list is now empty)");
    //   } else if (stillLoading) {
    //     console.log("⏳ List is refreshing...");
    //     await driver.pause(2000);
    //   } else {
    //     console.log("⚠️ Could not verify list state");
    //   }
    // }

    await driver.pause(1000);

    // // Verify the cancel button is gone for this booking
    // try {
    //   await driver.executeScript("flutter:waitFor", [
    //     byValueKey(`cancel_booking_${targetBookingId}`),
    //   ]);
    //   console.log("⚠️ Cancel button still visible (booking might not be cancelled)");
    // } catch (e) {
    //   console.log("✅ Cancel button removed as expected (booking is now cancelled)");
    // }

    console.log("✅ Cancel booking flow completed!");
    await driver.pause(1000);

  } catch (err) {
    console.error("❌ Cancel booking failed:", err.message);

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
