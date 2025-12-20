const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Performance & Training UI test", function () {
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
  it("should navigate to Performance & Training page", async function () {
    const feedbackNav = await driver.findElement(
      By.id("nav-performanceTraining")
    );
    await feedbackNav.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("performance-training-title")),
      10000
    );

    assert.strictEqual(await pageTitle.getText(), "Performace & Training");
    console.log("✅ Performance & Training page loaded");
  });

  /* =======================
   TRAINING COURSES – ASSIGN FLOW
======================= */
it("should search, open course, and assign to user", async function () {
  /* ✅ 1. Verify we are on FIRST TAB (Training Courses) */
  const trainingTab = await driver.findElement(By.id("tab-training"));
  assert.ok(await trainingTab.isDisplayed(), "Training tab not visible");

  const trainingContent = await driver.wait(
    until.elementLocated(By.id("training-course-list")),
    10000
  );
  assert.ok(await trainingContent.isDisplayed(), "Training content not loaded");

  console.log("✅ Default tab is Training Courses");

  /* ✅ 2. Search for 'cyber' */
  const searchInput = await driver.findElement(
    By.id("training-search-input")
  );
  await searchInput.clear();
  await searchInput.sendKeys("cyber");

  const searchButton = await driver.findElement(
    By.id("training-search-button")
  );
  await searchButton.click();

  console.log("🔍 Searching for course: cyber");

  /* ✅ 3. Wait for search result (single course expected) */
  const courseCard = await driver.wait(
    until.elementLocated(
      By.css('[data-testid^="training-course-card-"]')
    ),
    15000
  );

  await courseCard.click();
  console.log("📘 Training course selected");

  /* ✅ 4. Verify Assign Course dialog opens */
  const assignDialog = await driver.wait(
    until.elementLocated(By.id("assign-course-dialog")),
    10000
  );
  assert.ok(await assignDialog.isDisplayed(), "Assign dialog not opened");

  const dialogTitle = await driver.findElement(
    By.id("assign-course-dialog-title")
  );
  assert.strictEqual(
    await dialogTitle.getText(),
    "Assign Course",
    "Dialog title mismatch"
  );

  console.log("🪟 Assign Course dialog opened");

  /* =======================
     SELECT USER → Dilshan New (MUI FIX)
  ======================= */
  const userSelect = await driver.findElement(
    By.id("assign-user-select")
  );

  // MUI Select needs mouseDown
  await driver.actions()
    .move({ origin: userSelect })
    .press()
    .release()
    .perform();

  const userOption = await driver.wait(
    until.elementLocated(
      By.xpath("//li[contains(text(),'Dilshan New')]")
    ),
    10000
  );
  await userOption.click();

  console.log("👤 User selected: Dilshan New");

  /* =======================
     MANUAL DATE SELECTION
  ======================= */
  const dueDateInput = await driver.findElement(
    By.css('[data-testid="assign-due-date-input"] input')
  );

  await driver.executeScript("arguments[0].click();", dueDateInput);
  console.log("📅 Select DUE DATE manually...");
  await driver.sleep(10000); // ⏳ manual date selection time

  /* =======================
     ASSIGN COURSE
  ======================= */
  const assignButton = await driver.findElement(
    By.id("assign-course-submit-button")
  );
  await assignButton.click();

  console.log("📤 Assign Course button clicked");

  /* =======================
   SUCCESS SNACKBAR (FIXED)
======================= */
const snackbarAlert = await driver.wait(
  until.elementLocated(
    By.id("training-snackbar-alert")
  ),
  15000
);

await driver.wait(
  until.elementIsVisible(snackbarAlert),
  5000
);

const snackbarText = await snackbarAlert.getText();

if (
  !snackbarText.toLowerCase().includes("assigned")
) {
  throw new Error("Training course assignment snackbar not shown");
}

console.log("🎉 Training course assigned successfully");

});

/* =======================
   ASSIGN TARGET KPIs FLOW
======================= */
it("should assign target KPI to a user", async function () {
  /* =======================
     1. GO TO 2nd TAB
  ======================= */
  const targetKpiTab = await driver.findElement(
    By.id("tab-target-kpis")
  );
  await targetKpiTab.click();

  console.log("➡️ Navigated to Assign Target KPIs tab");

  const tabContent = await driver.wait(
    until.elementLocated(By.id("tab-content-performance")),
    10000
  );
  assert.ok(await tabContent.isDisplayed(), "Assign KPI tab not loaded");

  /* =======================
     2. VERIFY KPIs LOADED
  ======================= */
  const firstKpiCard = await driver.wait(
    until.elementLocated(
      By.css('[data-testid^="kpi-card-"]')
    ),
    15000
  );

  await driver.wait(until.elementIsVisible(firstKpiCard), 5000);
  console.log("📊 KPIs loaded successfully");

  /* =======================
     3. CLICK FIRST KPI
  ======================= */
  await firstKpiCard.click();
  console.log("📌 KPI selected");

  /* =======================
     4. VERIFY ASSIGN KPI DIALOG
  ======================= */
  const assignDialog = await driver.wait(
    until.elementLocated(By.id("assign-kpi-dialog")),
    10000
  );

  assert.ok(await assignDialog.isDisplayed(), "Assign KPI dialog not opened");

  const dialogTitle = await driver.findElement(
    By.id("assign-kpi-dialog-title")
  );
  assert.strictEqual(
    await dialogTitle.getText(),
    "Assign KPI Target",
    "Assign KPI dialog title mismatch"
  );

  console.log("🪟 Assign KPI dialog opened");

  /* =======================
     5. SELECT USER (MUI FIX)
  ======================= */
  const userSelect = await driver.findElement(
    By.id("assign-kpi-user-select")
  );

  await driver.actions()
    .move({ origin: userSelect })
    .press()
    .release()
    .perform();

  const userOption = await driver.wait(
    until.elementLocated(
      By.xpath("//li[contains(text(),'Dilshan New')]")
    ),
    10000
  );

  await userOption.click();
  console.log("👤 User selected: Dilshan New");

  /* =======================
     6. MANUAL PERIOD START
  ======================= */
  const periodStartInput = await driver.findElement(
    By.css('[data-testid="assign-kpi-period-start"] input')
  );
  await driver.executeScript("arguments[0].click();", periodStartInput);

  console.log("📅 Select PERIOD START manually...");
  await driver.sleep(10000);

  /* =======================
     7. MANUAL PERIOD END
  ======================= */
  const periodEndInput = await driver.findElement(
    By.css('[data-testid="assign-kpi-period-end"] input')
  );
  await driver.executeScript("arguments[0].click();", periodEndInput);

  console.log("📅 Select PERIOD END manually...");
  await driver.sleep(10000);

  /* =======================
     8. ENTER TARGET VALUE
  ======================= */
  const targetValueInput = await driver.findElement(
    By.id("assign-kpi-target-value")
  );
  await targetValueInput.clear();
  await targetValueInput.sendKeys("22");

  console.log("🎯 Target value entered: 22");

  /* =======================
     9. ASSIGN TARGET
  ======================= */
  const assignButton = await driver.findElement(
    By.id("assign-kpi-submit-button")
  );
  await assignButton.click();

  console.log("📤 Assign Target button clicked");

  /* =======================
     10. SUCCESS SNACKBAR
  ======================= */
  const snackbarAlert = await driver.wait(
    until.elementLocated(By.id("kpi-snackbar-alert")),
    15000
  );

  await driver.wait(
    until.elementIsVisible(snackbarAlert),
    5000
  );

  const snackbarText = await snackbarAlert.getText();
  if (!snackbarText.toLowerCase().includes("assigned")) {
    throw new Error("KPI assignment success snackbar not shown");
  }

  console.log("🎉 KPI target assigned successfully");
});


/* =======================
   KPI ACTUALS IMPORT FLOW
======================= */
it("should upload KPI actuals CSV and show success message", async function () {
  /* =======================
     1. GO TO IMPORT TAB
  ======================= */
  const importTab = await driver.findElement(
    By.id("tab-import")
  );
  await importTab.click();

  console.log("➡️ Navigated to Import Actual KPIs tab");

  const tabContent = await driver.wait(
    until.elementLocated(By.id("kpi-import-container")),
    10000
  );
  assert.ok(await tabContent.isDisplayed(), "KPI Import tab not loaded");

  /* =======================
     2. CHOOSE FILE (MANUAL)
  ======================= */
  const fileInput = await driver.findElement(
    By.id("kpi-import-file-input")
  );

  // Click file input so OS dialog opens
  await driver.executeScript("arguments[0].click();", fileInput);

  console.log("📁 Please select CSV file manually...");
  await driver.sleep(15000); // ⏳ time for manual file selection

  /* =======================
     3. CLICK UPLOAD
  ======================= */
  const uploadButton = await driver.findElement(
    By.id("upload-csv-button")
  );
  await uploadButton.click();

  console.log("📤 Upload button clicked");

  /* =======================
     4. WAIT FOR SUCCESS SNACKBAR
  ======================= */
  const snackbarAlert = await driver.wait(
    until.elementLocated(By.id("kpi-import-snackbar-alert")),
    15000
  );

  await driver.wait(
    until.elementIsVisible(snackbarAlert),
    5000
  );

  const snackbarText = await snackbarAlert.getText();
  if (!snackbarText.toLowerCase().includes("success")) {
    throw new Error("KPI actuals upload success snackbar not shown");
  }

  console.log("🎉 KPI actuals file uploaded successfully");

  /* =======================
     5. EXTRA WAIT (JOB RUN)
  ======================= */
  console.log("⏳ Waiting for background job processing...");
  await driver.sleep(5000);
});


/* =======================
   KPI SNAPSHOTS FLOW
======================= */
it("should fetch KPI snapshots for a user and KPI", async function () {
  /* =======================
     1. GO TO KPI SNAPSHOTS TAB
  ======================= */
  const snapshotsTab = await driver.findElement(
    By.id("tab-kpi-snapshots")
  );
  await snapshotsTab.click();

  console.log("➡️ Navigated to KPI Snapshots tab");

  const tabContent = await driver.wait(
    until.elementLocated(By.id("tab-content-kpi-snapshots")),
    10000
  );
  assert.ok(await tabContent.isDisplayed(), "KPI Snapshots tab not loaded");

  /* =======================
     2. SELECT USER (MUI FIX)
  ======================= */
  const userSelect = await driver.findElement(
    By.id("kpi-snapshot-user-select")
  );

  await driver.actions()
    .move({ origin: userSelect })
    .press()
    .release()
    .perform();

  const adminUserOption = await driver.wait(
    until.elementLocated(
      By.xpath("//li[contains(text(),'Dilshan New')]")
    ),
    10000
  );
  await adminUserOption.click();

  console.log("👤 User selected: Admin User1");

  /* =======================
   3. SELECT KPI (PORTAL-SAFE FINAL FIX)
======================= */
const kpiSelect = await driver.findElement(
  By.id("kpi-snapshot-kpi-select")
);

// Ensure visible
await driver.executeScript("arguments[0].scrollIntoView(true);", kpiSelect);

// Open dropdown (real click)
await kpiSelect.click();
await driver.sleep(500);

// 🔥 Wait for MUI portal options
const kpiOptions = await driver.wait(
  until.elementsLocated(
    By.xpath("//li[@role='option']")
  ),
  10000
);

// Safety check
if (kpiOptions.length < 2) {
  throw new Error("Not enough KPI options rendered");
}

// ✅ Click 2nd option → Task Completion
await kpiOptions[0].click();

console.log("📊 KPI selected: Task Completion");

  /* =======================
     4. MANUAL START DATE
  ======================= */
  const startDateInput = await driver.findElement(
    By.css('[data-testid="kpi-snapshot-start-date"] input')
  );
  await driver.executeScript("arguments[0].click();", startDateInput);

  console.log("📅 Select START DATE manually...");
  await driver.sleep(10000);

  /* =======================
     5. MANUAL END DATE
  ======================= */
  const endDateInput = await driver.findElement(
    By.css('[data-testid="kpi-snapshot-end-date"] input')
  );
  await driver.executeScript("arguments[0].click();", endDateInput);

  console.log("📅 Select END DATE manually...");
  await driver.sleep(10000);

  /* =======================
     6. FETCH SNAPSHOTS
  ======================= */
  const fetchButton = await driver.findElement(
    By.id("kpi-snapshot-fetch-button")
  );
  await fetchButton.click();

  console.log("📥 Fetch KPI snapshots");

  /* =======================
     7. VERIFY RESULTS
  ======================= */
  // Wait for either loading spinner or table
  await driver.wait(async () => {
    const loading = await driver.findElements(
      By.id("kpi-snapshot-loading-spinner")
    );
    return loading.length === 0;
  }, 15000);

  const snapshotRows = await driver.wait(
    until.elementsLocated(
      By.css('[data-testid^="kpi-snapshot-row-"]')
    ),
    15000
  );

  assert.ok(snapshotRows.length > 0, "No KPI snapshots found");

  console.log(`📈 ${snapshotRows.length} KPI snapshot(s) fetched successfully`);

  /* =======================
     5. EXTRA WAIT (JOB RUN)
  ======================= */
  console.log("⏳ Waiting for background job processing...");
  await driver.sleep(5000);
});


after(async function () {
    if (driver) {
      console.log("🚀 Closing browser...");
      await driver.quit(); // closes all tabs and ends session
  }
  });
});
