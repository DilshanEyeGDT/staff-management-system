const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Room & Resource Booking UI test", function () {
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
  it("should navigate to Room & Resource Booking page", async function () {
    const feedbackNav = await driver.findElement(
      By.id("nav-roomBooking")
    );
    await feedbackNav.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("room-booking-title")),
      10000
    );

    assert.strictEqual(await pageTitle.getText(), "Room & Resource Booking");
    console.log("✅ Room & Resource Booking page loaded");
  });

    it("should load first tab (Add Rooms & Reservations) and fetch rooms", async function () {
    /* =======================
       CONFIRM FIRST TAB ACTIVE
    ======================= */

    const roomTab = await driver.wait(
      until.elementLocated(By.id("tab-room-booking")),
      10000
    );

    // MUI active tab usually has aria-selected="true"
    const isSelected = await roomTab.getAttribute("aria-selected");
    assert.strictEqual(isSelected, "true", "First tab is not active");

    console.log("✅ First tab (Add Rooms & Reservations) is active");

    /* =======================
       CONFIRM TAB CONTENT
    ======================= */

    const tabContent = await driver.wait(
      until.elementLocated(By.id("tab-content-room-booking")),
      10000
    );

    assert.ok(tabContent, "Tab content container not found");
    console.log("✅ Room booking tab content rendered");

    /* =======================
       WAIT FOR ROOMS FETCH
    ======================= */

    // Either:
    // 1. Loader disappears
    // 2. Rooms list appears
    // 3. Empty state appears

    await driver.wait(async () => {
      const loaders = await driver.findElements(By.id("rooms-loading-spinner"));
      const roomCards = await driver.findElements(
        By.css('[data-testid^="room-card-wrapper-"]')
      );
      const emptyText = await driver.findElements(By.id("rooms-empty"));

      return (
        loaders.length === 0 &&
        (roomCards.length > 0 || emptyText.length > 0)
      );
    }, 20000);

    console.log("✅ Room fetch completed");

    /* =======================
       ASSERT ROOMS RENDERED
    ======================= */

    const roomCards = await driver.findElements(
      By.css('[data-testid^="room-card-wrapper-"]')
    );

    if (roomCards.length > 0) {
      console.log(`✅ ${roomCards.length} room(s) displayed`);
      assert.ok(roomCards.length > 0, "Rooms not rendered");
    } else {
      const emptyState = await driver.findElement(By.id("rooms-empty"));
      assert.strictEqual(
        await emptyState.getText(),
        "No rooms found.",
        "Unexpected empty rooms message"
      );
      console.log("⚠️ No rooms found (empty state shown)");
    }
  });

    it("should add a new room using the floating add button", async function () {
    /* =======================
       OPEN ADD ROOM DIALOG
    ======================= */

    const addButton = await driver.wait(
      until.elementLocated(By.id("room-add-floating-button")),
      10000
    );

    await driver.executeScript("arguments[0].click();", addButton);
    console.log("➕ Floating add button clicked");

    /* =======================
       WAIT FOR DIALOG
    ======================= */

    const dialog = await driver.wait(
      until.elementLocated(By.id("add-room-dialog")),
      10000
    );
    await driver.wait(until.elementIsVisible(dialog), 5000);

    console.log("🪟 Add Room dialog opened");

    /* =======================
       FILL FORM FIELDS
    ======================= */

    const timestamp = Date.now(); // to avoid duplicate room names

    const roomNameInput = await driver.findElement(By.id("add-room-name"));
    const descInput = await driver.findElement(By.id("add-room-description"));
    const capacityInput = await driver.findElement(By.id("add-room-capacity"));
    const locationInput = await driver.findElement(By.id("add-room-location"));
    const equipmentsInput = await driver.findElement(By.id("add-room-equipments"));

    await roomNameInput.sendKeys(`Selenium Test Room ${timestamp}`);
    await descInput.sendKeys("Room created via Selenium automation");
    await capacityInput.sendKeys("25");
    await locationInput.sendKeys("G");
    await equipmentsInput.sendKeys("Projector, AC, Whiteboard");

    console.log("✍️ Room details entered");

    /* =======================
       SUBMIT FORM
    ======================= */

    const confirmBtn = await driver.findElement(By.id("add-room-confirm"));
    await driver.wait(until.elementIsEnabled(confirmBtn), 5000);
    await driver.executeScript("arguments[0].click();", confirmBtn);

    console.log("🚀 Add Room button clicked");

    /* =======================
       SUCCESS SNACKBAR
    ======================= */

    const snackbar = await driver.wait(
      until.elementLocated(By.id("rooms-snackbar")),
      10000
    );
    await driver.wait(until.elementIsVisible(snackbar), 5000);

    const snackbarText = await snackbar.getText();
    assert.ok(
      snackbarText.toLowerCase().includes("room added"),
      "Room added success snackbar not shown"
    );

    console.log("🎉 Room added successfully (snackbar shown)");

    /* =======================
       OPTIONAL: VERIFY ROOM LIST UPDATED
    ======================= */

    await driver.wait(async () => {
      const cards = await driver.findElements(
        By.css('[data-testid^="room-card-wrapper-"]')
      );
      return cards.length > 0;
    }, 10000);

    console.log("📦 Room list refreshed");
  });

    it("should filter room reservations by user name and room name", async function () {
    /* =======================
       GO TO ALL RESERVATIONS TAB
    ======================= */

    const reservationsTab = await driver.wait(
      until.elementLocated(By.id("tab-room-reservations")),
      10000
    );

    await driver.executeScript("arguments[0].click();", reservationsTab);
    console.log("📑 Navigated to All Reservations tab");

    /* =======================
       CONFIRM TAB CONTENT
    ======================= */

    const tabContent = await driver.wait(
      until.elementLocated(By.id("tab-content-room-reservations")),
      10000
    );

    assert.ok(tabContent, "Reservations tab content not loaded");
    console.log("✅ Reservations tab content rendered");

    /* =======================
       WAIT FOR INITIAL FETCH
    ======================= */

    await driver.wait(async () => {
      const loaders = await driver.findElements(
        By.id("all-bookings-loading-spinner")
      );
      return loaders.length === 0;
    }, 20000);

    console.log("📦 Initial bookings fetch completed");

    /* =======================
       APPLY FILTERS
    ======================= */

    const userNameFilter = await driver.wait(
      until.elementLocated(By.id("filter-user-name")),
      5000
    );
    const roomNameFilter = await driver.wait(
      until.elementLocated(By.id("filter-room-name")),
      5000
    );

    // Clear existing values (safe)
    await userNameFilter.clear();
    await roomNameFilter.clear();

    await userNameFilter.sendKeys("tha");
    await roomNameFilter.sendKeys("conf");

    console.log("🔍 Filters applied: user='tha', room='conf'");

    /* =======================
       WAIT FOR FILTERED RESULTS
    ======================= */

    await driver.wait(async () => {
      const bookingCards = await driver.findElements(
        By.css('[data-testid^="booking-card-"]')
      );
      const emptyState = await driver.findElements(
        By.id("bookings-empty")
      );

      return bookingCards.length > 0 || emptyState.length > 0;
    }, 10000);

    /* =======================
       ASSERT RESULTS
    ======================= */

    const bookingCards = await driver.findElements(
      By.css('[data-testid^="booking-card-"]')
    );

    if (bookingCards.length > 0) {
      console.log(`✅ ${bookingCards.length} booking(s) displayed after filtering`);
      assert.ok(bookingCards.length > 0, "Filtered bookings not displayed");
    } else {
      const emptyText = await driver.findElement(By.id("bookings-empty"));
      assert.strictEqual(
        await emptyText.getText(),
        "No bookings found.",
        "Unexpected empty bookings message"
      );
      console.log("⚠️ No bookings matched filters (empty state shown)");
    }
  });

    it("should fetch room utilization report and download PDF", async function () {
    /* =======================
       GO TO KPI TAB
    ======================= */

    const kpiTab = await driver.wait(
      until.elementLocated(By.id("tab-kpi")),
      10000
    );

    await driver.executeScript("arguments[0].click();", kpiTab);
    console.log("📊 Navigated to Rooms KPI tab");

    /* =======================
       CONFIRM KPI PAGE
    ======================= */

    const kpiPage = await driver.wait(
      until.elementLocated(By.id("room-utilization-page")),
      10000
    );
    assert.ok(kpiPage, "Room Utilization page not loaded");

    console.log("✅ Room Utilization page loaded");

        /* =======================
       MANUAL DATE PICKERS (EXTENDED TIME)
    ======================= */

    const startDateInput = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="utilization-filter-start-date"] input')
      ),
      5000
    );

    const endDateInput = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="utilization-filter-end-date"] input')
      ),
      5000
    );

    // START DATE
    await driver.executeScript("arguments[0].click();", startDateInput);
    console.log("⏱ Please manually select START date...");
    await driver.sleep(10000); // ⬅️ increased to 10 seconds

    // END DATE
    await driver.executeScript("arguments[0].click();", endDateInput);
    console.log("⏱ Please manually select END date...");
    await driver.sleep(10000); // ⬅️ increased to 10 seconds


    /* =======================
       SELECT GROUP BY = TIME
    ======================= */

    const groupBySelect = await driver.findElement(
      By.id("utilization-filter-groupby")
    );
    await groupBySelect.click();

    const groupByTime = await driver.wait(
      until.elementLocated(By.id("utilization-groupby-time")),
      10000
    );
    await groupByTime.click();

    console.log("✅ Group By filter set to TIME");

    /* =======================
       FETCH REPORT
    ======================= */

    const fetchBtn = await driver.findElement(
      By.id("utilization-fetch-btn")
    );
    await driver.executeScript("arguments[0].click();", fetchBtn);

    console.log("🚀 Fetch report clicked");

    /* =======================
       WAIT FOR FETCH RESULT
    ======================= */

    await driver.wait(async () => {
      const loader = await driver.findElements(
        By.id("room-utilization-loading-spinner")
      );
      const table = await driver.findElements(
        By.id("room-utilization-table")
      );
      const snackbar = await driver.findElements(
        By.id("room-utilization-snackbar")
      );

      return loader.length === 0 && (table.length > 0 || snackbar.length > 0);
    }, 20000);

    console.log("📈 Report fetch completed");

    /* =======================
       ASSERT TABLE OR NO DATA
    ======================= */

    const table = await driver.findElements(
      By.id("room-utilization-table")
    );

    if (table.length > 0) {
      console.log("✅ Utilization table displayed");
      const rows = await driver.findElements(
        By.css('[data-testid^="utilization-row-"]')
      );
      assert.ok(rows.length > 0, "Utilization table has no rows");
    } else {
      const snackbar = await driver.findElement(
        By.id("room-utilization-snackbar")
      );
      const text = await snackbar.getText();
      assert.ok(
        text.toLowerCase().includes("no data"),
        "Expected no data snackbar not shown"
      );
      console.log("⚠️ No data available for selected range");
    }

    /* =======================
       DOWNLOAD PDF
    ======================= */

    const downloadBtn = await driver.findElement(
      By.id("utilization-download-btn")
    );
    await driver.executeScript("arguments[0].click();", downloadBtn);

    console.log("📄 Download PDF button clicked");
  });


after(async function () {
    if (driver) {
      console.log("🚀 Closing browser...");
      await driver.quit(); // closes all tabs and ends session
  }
  });
});
