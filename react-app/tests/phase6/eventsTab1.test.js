const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Events Tab UI test", function () {
  this.timeout(90000);
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("🚀 Opening dashboard...");
    await driver.get(DASHBOARD_URL);

    // Inject valid Admin token manually
    await driver.executeScript(
      `window.localStorage.setItem('token', '${ACCESS_TOKEN}');`
    );

    await driver.navigate().refresh();

    // Wait until dashboard sidebar appears
    await driver.wait(until.elementLocated(By.id("dashboard-side-panel")), 30000);

    const title = await driver.findElement(By.id("dashboard-title")).getText();
    assert.ok(title.includes("Admin Portal"), "Admin Portal title missing");
    console.log("✅ Dashboard loaded successfully as Admin");
  });

  /* =======================
     NAVIGATION
  ======================= */
  it("should navigate to Events & Announcements page", async function () {
    const feedbackNav = await driver.findElement(
      By.id("nav-eventsAnnouncements")
    );
    await feedbackNav.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("events-announcements-title")),
      10000
    );

    assert.strictEqual(await pageTitle.getText(), "Events & Announcements");
    console.log("✅ Events & Announcements page loaded");
  });

  /* =======================
   EVENTS TAB – FILTER & FETCH
======================= */
it("should filter events by channel and date and fetch results", async function () {
  console.log("🧪 Verifying default Events tab...");

  /* ---------- Confirm first tab is active ---------- */
  const eventsTab = await driver.findElement(By.id("tab-events"));
  const tabSelected = await eventsTab.getAttribute("aria-selected");

  assert.strictEqual(tabSelected, "true", "Events tab is not active by default");
  console.log("✅ 'Create & Update Events' tab is active");

  /* ---------- Confirm EventsTab content ---------- */
  await driver.wait(
    until.elementLocated(By.css('[data-testid="events-container"]')),
    10000
  );
  console.log("✅ EventsTab component loaded");

  /* ---------- Select Channel = Email ---------- */
  const channelSelect = await driver.findElement(
    By.css('[data-testid="events-channel-select"]')
  );
  await channelSelect.click();

  const emailOption = await driver.findElement(
    By.css('[data-testid="events-channel-email"]')
  );
  await emailOption.click();

  console.log("✅ Channel filter set to EMAIL");

  /* ---------- Manual Since Date Selection ---------- */
const sinceDatePicker = await driver.findElement(
  By.css('[data-testid="events-since-date"]')
);

// Force click using JS (safe for MUI)
await driver.executeScript(
  "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
  sinceDatePicker
);
await driver.executeScript("arguments[0].click();", sinceDatePicker);

console.log("⏱ Please manually select the SINCE date in the calendar...");
await driver.sleep(8000); // wait for manual selection


  /* ---------- Click Fetch Events ---------- */
  const fetchButton = await driver.findElement(
    By.css('[data-testid="events-fetch-button"]')
  );
  await fetchButton.click();

  console.log("🚀 Fetch Events clicked");

  /* ---------- Validate Fetch Result ---------- */
  await driver.wait(async () => {
    const loading = await driver.findElements(
      By.css('[data-testid="events-loading"]')
    );
    const cards = await driver.findElements(
      By.css('[data-testid^="event-card-"]')
    );
    const empty = await driver.findElements(
      By.css('[data-testid="events-empty"]')
    );

    return loading.length > 0 || cards.length > 0 || empty.length > 0;
  }, 15000);

  console.log("✅ Events fetch completed");

  /* ---------- Final Assertion ---------- */
  const eventCards = await driver.findElements(
    By.css('[data-testid^="event-card-"]')
  );

  if (eventCards.length > 0) {
    console.log(`✅ ${eventCards.length} event(s) displayed`);
    assert.ok(eventCards.length >= 1);
  } else {
    const emptyText = await driver.findElement(
      By.css('[data-testid="events-empty"]')
    );
    assert.strictEqual(
      await emptyText.getText(),
      "No events found."
    );
    console.log("ℹ️ No events found for selected filters");
  }
});

  /* =======================
   EVENT DETAILS DIALOG
======================= */
it("should open event details dialog when clicking an event and close it", async function () {
  console.log("🧪 Clicking first fetched event...");

  /* ---------- Wait for at least one event card ---------- */
  const firstEventCard = await driver.wait(
    until.elementLocated(By.css('[data-testid^="event-card-"]')),
    15000
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
    firstEventCard
  );
  await driver.executeScript("arguments[0].click();", firstEventCard);

  console.log("✅ Event card clicked");

  /* ---------- Wait for dialog to open ---------- */
  const dialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="event-details-dialog"]')),
    10000
  );

  assert.ok(await dialog.isDisplayed(), "Event details dialog not visible");
  console.log("✅ Event Details dialog opened");

  /* ---------- Handle loading state ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="event-details-loading"]')
    );
    return loaders.length === 0;
  }, 15000);

  console.log("✅ Event details loaded");

  /* ---------- Validate essential content ---------- */
  const title = await driver.findElement(
    By.css('[data-testid="event-details-event-title"]')
  );
  const summary = await driver.findElement(
    By.css('[data-testid="event-details-event-summary"]')
  );

  assert.ok(await title.getText(), "Event title missing");
  assert.ok(await summary.getText(), "Event summary missing");

  console.log("📄 Event Title:", await title.getText());

  /* ---------- Close dialog ---------- */
  const closeButton = await driver.findElement(
    By.css('[data-testid="event-details-close-button"]')
  );
  await closeButton.click();

  console.log("❌ Close button clicked");

  /* ---------- Confirm dialog is closed ---------- */
  await driver.wait(
    until.stalenessOf(dialog),
    10000
  );

  console.log("✅ Event Details dialog closed successfully");
});

  
  /* =======================
   CREATE NEW EVENT
======================= */
it("should create a new event successfully", async function () {
  console.log("🧪 Creating a new event...");

  /* ---------- Confirm first tab is active ---------- */
  const eventsTab = await driver.findElement(By.id("tab-events"));
  const tabSelected = await eventsTab.getAttribute("aria-selected");

  assert.strictEqual(tabSelected, "true", "Events tab is not active by default");
  console.log("✅ 'Create & Update Events' tab is active");

  /* =======================
     OPEN CREATE DIALOG
  ======================= */
  const addButton = await driver.wait(
    until.elementLocated(By.css('[data-testid="events-add-button"]')),
    10000
  );

  await driver.executeScript("arguments[0].click();", addButton);

  const dialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="create-event-dialog"]')),
    10000
  );
  await driver.wait(until.elementIsVisible(dialog), 10000);

  console.log("✅ Create Event dialog opened");

  /* =======================
     TITLE (IMPORTANT FIX)
  ======================= */
  const titleInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-event-title-input"] input')
    ),
    5000
  );
  await titleInput.sendKeys("Selenium Automation Event");

  /* =======================
     SUMMARY
  ======================= */
  const summaryInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-event-summary-input"] textarea')
    ),
    5000
  );
  await summaryInput.sendKeys(
    "This event is created using Selenium automation."
  );

  /* =======================
     ANNOUNCEMENT CONTENT
  ======================= */
  const contentInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-event-content-input"] textarea')
    ),
    5000
  );
  await contentInput.sendKeys(
    "Automation-based announcement content for testing."
  );

  console.log("✍️ Event text fields filled");

  /* =======================
     MANUAL DATE TIME PICKER
  ======================= */
  const scheduledAtInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-event-scheduled-at-input"] input')
    ),
    5000
  );

  await driver.executeScript("arguments[0].click();", scheduledAtInput);
  console.log("⏱ Please manually select Scheduled Date & Time...");
  await driver.sleep(10000); // manual selection

  /* =======================
     TAG INPUT (ENTER KEY)
  ======================= */
  const tagInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-event-tag-input"] input')
    ),
    5000
  );
  await tagInput.sendKeys("automation", Key.ENTER);

  console.log("🏷️ Tag added");

  /* =======================
     SUBMIT
  ======================= */
  const submitBtn = await driver.wait(
    until.elementLocated(By.css('[data-testid="create-event-submit-button"]')),
    10000
  );
  await driver.wait(until.elementIsEnabled(submitBtn), 10000);
  await submitBtn.click();

  console.log("🚀 Create button clicked");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-event-snackbar-alert"]')
    ),
    15000
  );
  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  assert.ok(
    snackbarText.toLowerCase().includes("success"),
    "Success snackbar not shown"
  );

  console.log("✅ Event created successfully");

  /* =======================
     DIALOG CLOSED
  ======================= */
  await driver.wait(until.stalenessOf(dialog), 15000);
});

  /* =======================
   VERIFY CREATED EVENT EXISTS
======================= */
it("should find the newly created event when filtering with Channel = All", async function () {
  const CREATED_EVENT_TITLE = "Selenium Automation Event";

  console.log("🧪 Verifying created event exists in All channel");

  /* ---------- Select Channel = All ---------- */
const channelSelect = await driver.findElement(
  By.css('[data-testid="events-channel-select"]')
);
await channelSelect.click(); // normal click works better for MUI

const allOption = await driver.findElement(
  By.css('[data-testid="events-channel-all"]')
);
await allOption.click();

console.log("✅ Channel filter set to ALL");


  /* ---------- Click Fetch Events ---------- */
  const fetchButton = await driver.wait(
    until.elementLocated(By.css('[data-testid="events-fetch-button"]')),
    10000
  );
  await fetchButton.click();

  console.log("🚀 Fetch Events clicked");

  /* ---------- Wait for fetch completion ---------- */
  await driver.wait(async () => {
    const loading = await driver.findElements(
      By.css('[data-testid="events-loading"]')
    );
    return loading.length === 0;
  }, 15000);

  /* ---------- Collect event titles ---------- */
  const eventTitles = await driver.findElements(
    By.css('[data-testid^="event-title-"]')
  );

  let found = false;
  for (const titleEl of eventTitles) {
    const text = await titleEl.getText();
    if (text === CREATED_EVENT_TITLE) {
      found = true;
      console.log("🎯 Created event found:", text);
      break;
    }
  }

  assert.ok(
    found,
    `Created event "${CREATED_EVENT_TITLE}" not found in events list`
  );

  console.log("✅ Created event verified successfully");
});

/* =======================
   VIEW DETAILS OF CREATED EVENT
======================= */
it("should open the event details dialog for the verified event and close it", async function () {
  const CREATED_EVENT_TITLE = "Selenium Automation Event";

  console.log("🧪 Clicking on the verified event to view details");

  // Wait for events to be loaded
  await driver.wait(
    until.elementsLocated(By.css('[data-testid^="event-title-"]')),
    10000
  );

  const eventTitles = await driver.findElements(
    By.css('[data-testid^="event-title-"]')
  );

  let targetEvent;
  for (const titleEl of eventTitles) {
    const text = await titleEl.getText();
    if (text === CREATED_EVENT_TITLE) {
      targetEvent = titleEl;
      break;
    }
  }

  assert.ok(targetEvent, `Event "${CREATED_EVENT_TITLE}" not found to click`);

  // Click on the event card
  const parentCard = await targetEvent.findElement(By.xpath('..'));
  await parentCard.click();

  console.log("🚀 Event clicked, waiting for details dialog...");

  // Wait for EventDetailsDialog
  const dialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="event-details-dialog"]')),
    10000
  );
  await driver.wait(until.elementIsVisible(dialog), 5000);

  const dialogTitle = await driver.findElement(
    By.css('[data-testid="event-details-event-title"]')
  );
  const titleText = await dialogTitle.getText();

  assert.strictEqual(
    titleText,
    CREATED_EVENT_TITLE,
    "Event details title does not match"
  );

  console.log("✅ EventDetailsDialog opened successfully with correct title");

  // Close the dialog
  const closeBtn = await driver.findElement(
    By.css('[data-testid="event-details-close-button"]')
  );
  await closeBtn.click();

  console.log("✅ Event Details dialog closed successfully");
});


/* =======================
   EDIT CREATED EVENT SUMMARY (FIXED)
======================= */
it("should edit the created event's summary successfully", async function () {
  const CREATED_EVENT_TITLE = "Selenium Automation Event";
  const NEW_SUMMARY = "Updated summary via Selenium test";

  console.log("🧪 Editing the created event summary");

  // Wait for event titles to load
  await driver.wait(
    until.elementsLocated(By.css('[data-testid^="event-title-"]')),
    10000
  );

  // Find the target event
  const eventTitles = await driver.findElements(
    By.css('[data-testid^="event-title-"]')
  );

  let targetEvent;
  for (const titleEl of eventTitles) {
    const text = await titleEl.getText();
    if (text === CREATED_EVENT_TITLE) {
      targetEvent = titleEl;
      break;
    }
  }

  assert.ok(targetEvent, `Event "${CREATED_EVENT_TITLE}" not found to edit`);

  // Click the event to open details
  const parentCard = await targetEvent.findElement(By.xpath('..'));
  await driver.wait(until.elementIsVisible(parentCard), 5000);
  await parentCard.click();

  console.log("🚀 Event clicked, waiting for EventDetailsDialog...");

  const detailsDialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="event-details-dialog"]')),
    10000
  );
  await driver.wait(until.elementIsVisible(detailsDialog), 5000);

  // Click Edit button
  const editBtn = await driver.wait(
    until.elementLocated(By.css('[data-testid="event-details-edit-button"]')),
    5000
  );
  await driver.wait(until.elementIsVisible(editBtn), 5000);
  await driver.wait(until.elementIsEnabled(editBtn), 5000);
  await editBtn.click();

  console.log("✏️ Edit button clicked, waiting for EditEventDialog...");

  // Wait for EditEventDialog to appear
  const editDialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="edit-event-dialog"]')),
    10000
  );
  await driver.wait(until.elementIsVisible(editDialog), 5000);

  // -----------------------
  // Focus and type into summary field
  // -----------------------
  const summaryInput = await driver.wait(
    until.elementLocated(By.css('[data-testid="edit-event-summary-input"]')),
    5000
  );

  await driver.wait(until.elementIsVisible(summaryInput), 5000);
  await driver.wait(until.elementIsEnabled(summaryInput), 5000);

  // Use Actions to focus and select existing value
  await driver.actions({ bridge: true })
    .move({ origin: summaryInput })
    .click()
    .keyDown(Key.CONTROL)
    .sendKeys("a")   // select all
    .keyUp(Key.CONTROL)
    .sendKeys(Key.BACK_SPACE) // delete existing text
    .sendKeys(NEW_SUMMARY)
    .perform();

  console.log(`📝 Summary updated to: "${NEW_SUMMARY}"`);

  // Click Update button
  const updateBtn = await driver.wait(
    until.elementLocated(By.css('[data-testid="edit-event-submit-button"]')),
    5000
  );
  await driver.wait(until.elementIsEnabled(updateBtn), 5000);
  await updateBtn.click();

  console.log("🚀 Update button clicked, waiting for success snackbar...");

  // Wait for success snackbar (robust)
  const snackbar = await driver.wait(async () => {
    const elements = await driver.findElements(By.css('[data-testid="event-details-snackbar-alert"]'));
    if (elements.length === 0) return false;
    const text = await elements[0].getText();
    return text.toLowerCase().includes("success") ? elements[0] : false;
  }, 10000);
  console.log("✅ Snackbar detected with success message");

  // Close EventDetailsDialog
  const closeBtn = await driver.findElement(
    By.css('[data-testid="event-details-close-button"]')
  );
  await closeBtn.click();

  console.log("✅ Event details dialog closed after editing");
});

  /* =======================
   VERIFY CREATED EVENT IN CONFIRMATIONS TAB
======================= */
it("should find the created event in Event Confirmations tab", async function () {
  const CREATED_EVENT_TITLE = "Selenium Automation Event";

  console.log("🧪 Switching to Event Confirmations tab");

  /* ---------- Click Event Confirmations tab ---------- */
  const confirmTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-confirm-events"]')),
    10000
  );
  await confirmTab.click();

  /* ---------- Wait for tab content ---------- */
  const container = await driver.wait(
    until.elementLocated(By.css('[data-testid="draft-events-container"]')),
    10000
  );

  console.log("✅ Event Confirmations tab loaded");

  /* ---------- Wait until loading ends ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="draft-events-loading"]')
    );
    return loaders.length === 0;
  }, 15000);

  /* ---------- Collect draft event cards ---------- */
  const draftEvents = await driver.findElements(
    By.css('[data-testid^="draft-event-"]')
  );

  let found = false;

  for (const eventCard of draftEvents) {
    const cardText = await eventCard.getText();

    if (cardText.includes(CREATED_EVENT_TITLE)) {
      found = true;
      console.log("🎯 Created event found in confirmations tab");
      break;
    }
  }

  assert.ok(
    found,
    `Created event "${CREATED_EVENT_TITLE}" not found in Event Confirmations tab`
  );

  console.log("✅ Created event verified in Event Confirmations tab");
});


/* =======================
   APPROVE CREATED EVENT (EMAIL)
======================= */
it("should approve the created event with Email channel", async function () {
  const CREATED_EVENT_TITLE = "Selenium Automation Event";

  console.log("🧪 Approving created event with Email channel");

  /* ---------- Ensure Confirmations tab is active ---------- */
  const container = await driver.wait(
    until.elementLocated(By.css('[data-testid="draft-events-container"]')),
    10000
  );

  /* ---------- Wait until loading ends ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="draft-events-loading"]')
    );
    return loaders.length === 0;
  }, 15000);

  /* ---------- Find the created draft event ---------- */
  const draftEvents = await driver.findElements(
    By.css('[data-testid^="draft-event-"]')
  );

  let targetEventId = null;

  for (const eventCard of draftEvents) {
    const cardText = await eventCard.getText();

    if (cardText.includes(CREATED_EVENT_TITLE)) {
      const testId = await eventCard.getAttribute("data-testid");
      targetEventId = testId.split("draft-event-")[1];
      break;
    }
  }

  assert.ok(
    targetEventId,
    `Created event "${CREATED_EVENT_TITLE}" not found to approve`
  );

  console.log("🎯 Target event ID:", targetEventId);

  /* ---------- Click Approve button ---------- */
  const approveBtn = await driver.findElement(
    By.css(`[data-testid="draft-event-approve-${targetEventId}"]`)
  );
  await driver.wait(until.elementIsVisible(approveBtn), 5000);
  await driver.wait(until.elementIsEnabled(approveBtn), 5000);
  await approveBtn.click();

  console.log("✅ Approve button clicked");

  /* ---------- Wait for channel dialog ---------- */
  const channelDialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="draft-event-channel-dialog"]')),
    10000
  );
  await driver.wait(until.elementIsVisible(channelDialog), 5000);

  console.log("📡 Channel selection dialog opened");

  /* ---------- Select Email channel ---------- */
  const emailRadio = await driver.findElement(
    By.css('[data-testid="draft-event-channel-email"]')
  );
  await emailRadio.click();

  console.log("📧 Email channel selected");

  /* ---------- Confirm approval ---------- */
  const confirmBtn = await driver.findElement(
    By.css('[data-testid="draft-event-channel-confirm-button"]')
  );
  await driver.wait(until.elementIsEnabled(confirmBtn), 5000);
  await confirmBtn.click();

  console.log("🚀 Approval confirmed");

  /* ---------- Wait for success snackbar ---------- */
  const snackbar = await driver.wait(async () => {
    const alerts = await driver.findElements(
      By.css('[data-testid="draft-events-snackbar-alert"]')
    );
    if (alerts.length === 0) return false;

    const text = await alerts[0].getText();
    return text.toLowerCase().includes("approved") ? alerts[0] : false;
  }, 10000);

  console.log("✅ Approval success snackbar shown");

  /* ---------- Verify event removed from draft list (STALE-SAFE) ---------- */
await driver.wait(async () => {
  const cards = await driver.findElements(
    By.css('[data-testid^="draft-event-"]')
  );

  // No cards at all = definitely removed
  if (cards.length === 0) return true;

  for (const card of cards) {
    try {
      const text = await card.getText();
      if (text.includes(CREATED_EVENT_TITLE)) {
        return false;
      }
    } catch (err) {
      // Ignore stale elements during re-render
      return true;
    }
  }

  return true;
}, 10000);

console.log("🎉 Event approved and removed from draft list");

});

/* =======================
   SEND APPROVED EVENT
======================= */
it("should send the approved event successfully", async function () {
  const CREATED_EVENT_TITLE = "Selenium Automation Event";

  console.log("🧪 Switching to Broadcast Events tab");

  /* ---------- Click Broadcast Events tab ---------- */
  const broadcastTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-broadcast-events"]')),
    10000
  );
  await broadcastTab.click();

  /* ---------- Wait for Broadcast Events container ---------- */
  const container = await driver.wait(
    until.elementLocated(By.css('[data-testid="send-events-container"]')),
    10000
  );

  console.log("✅ Broadcast Events tab loaded");

  /* ---------- Wait for loading to finish ---------- */
  await driver.wait(async () => {
    const spinners = await driver.findElements(By.css(".MuiCircularProgress-root"));
    return spinners.length === 0;
  }, 15000);

  /* ---------- Find approved event ---------- */
  const eventCards = await driver.findElements(
    By.css('[data-testid^="send-event-card-"]')
  );

  let targetEventId = null;

  for (const card of eventCards) {
    const text = await card.getText();
    if (text.includes(CREATED_EVENT_TITLE)) {
      const testId = await card.getAttribute("data-testid");
      targetEventId = testId.replace("send-event-card-", "");
      break;
    }
  }

  assert.ok(
    targetEventId,
    `Approved event "${CREATED_EVENT_TITLE}" not found in Broadcast Events tab`
  );

  console.log("🎯 Approved event found with ID:", targetEventId);

  /* ---------- Click Send button ---------- */
  const sendBtn = await driver.findElement(
    By.css(`[data-testid="send-event-button-${targetEventId}"]`)
  );

  await driver.wait(until.elementIsVisible(sendBtn), 5000);
  await driver.wait(until.elementIsEnabled(sendBtn), 5000);
  await sendBtn.click();

  console.log("🚀 Send button clicked");

  /* ---------- Wait for success snackbar ---------- */
  const snackbar = await driver.wait(async () => {
    const alerts = await driver.findElements(
      By.css('[data-testid="send-events-snackbar-alert"]')
    );
    if (alerts.length === 0) return false;

    const text = await alerts[0].getText();
    return text.toLowerCase().includes("sent") ? alerts[0] : false;
  }, 10000);

  console.log("✅ Send success snackbar shown");

  /* ---------- Verify button is disabled / marked as Sent ---------- */
  await driver.wait(async () => {
    const btn = await driver.findElement(
      By.css(`[data-testid="send-event-button-${targetEventId}"]`)
    );
    const disabled = await btn.getAttribute("disabled");
    const label = await btn.getText();
    return disabled !== null || label.toLowerCase().includes("sent");
  }, 10000);

  console.log("🎉 Event successfully sent and marked as Sent");
});









  after(async function () {
    if (driver) {
      console.log("🚀 Closing browser...");
      await driver.quit(); // closes all tabs and ends session
  }
  });

});
