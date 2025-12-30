const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Leave & Attendance UI test", function () {
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
  it("should navigate to Leave & Attendance page", async function () {
    const feedbackNav = await driver.findElement(
      By.id("nav-leaveAttendance")
    );
    await feedbackNav.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("leave-attendance-title")),
      10000
    );

    assert.strictEqual(await pageTitle.getText(), "Leave & Attendance");
    console.log("✅ Leave & Attendance page loaded");
  });

  /* =======================
   DEFAULT TAB – LEAVE REQUESTS
======================= */
it("should load Leave Requests tab by default", async function () {
  console.log("🧪 Verifying default Leave Requests tab...");

  /* ---------- Confirm Leave Requests page container ---------- */
  const page = await driver.wait(
    until.elementLocated(By.id("leave-requests-page")),
    10000
  );
  assert.ok(await page.isDisplayed(), "Leave Requests page not visible");

  /* ---------- Confirm Leave Requests title ---------- */
  const title = await driver.findElement(By.id("leave-requests-title"));
  assert.strictEqual(
    await title.getText(),
    "Leave Requests",
    "Leave Requests title mismatch"
  );

  console.log("✅ Leave Requests page loaded");

  /* ---------- Confirm Leave Requests filter section ---------- */
  await driver.wait(
    until.elementLocated(By.id("leave-requests-filter-section")),
    10000
  );

  console.log("✅ Leave Requests filter section visible");

  /* ---------- Confirm default empty state (no user selected) ---------- */
  const noUserText = await driver.wait(
    until.elementLocated(By.id("lr-no-user")),
    10000
  );

  assert.strictEqual(
    await noUserText.getText(),
    "Please select a user to view leave requests."
  );

  console.log("✅ Default Leave Requests tab confirmed");
});

/* =======================
   FILTER – USER & STATUS (FIXED)
======================= */
it("should select Admin User1 and status All, then fetch leave requests", async function () {
  console.log("🧪 Selecting user and status filter...");

  /* ---------- Wait for User dropdown (slow API safe) ---------- */
  const userSelect = await driver.wait(
    until.elementLocated(By.css('[data-testid="lr-user-select"]')),
    15000
  );
  await driver.wait(until.elementIsEnabled(userSelect), 15000);

  console.log("✅ User dropdown loaded");

  /* ---------- Open User dropdown ---------- */
  await userSelect.click(); // normal click works best for MUI

  /* ---------- Select Admin User1 directly ---------- */
  const adminUserOption = await driver.wait(
    until.elementLocated(By.css('[data-testid="lr-user-option-1"]')),
    10000
  );
  await adminUserOption.click();

  console.log("✅ Selected user: Admin User1");

  /* ---------- Select Status = All ---------- */
  const statusSelect = await driver.findElement(
    By.css('[data-testid="lr-status-filter"]')
  );
  await statusSelect.click();

  const statusAll = await driver.wait(
    until.elementLocated(By.css('[data-testid="lr-status-all"]')),
    10000
  );
  await statusAll.click();

  console.log("✅ Status filter set to ALL");

  /* ---------- Wait for loading to start (if any) ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(By.css('[data-testid="lr-loading"]'));
    return loaders.length >= 0; // safe trigger
  }, 5000);

  /* ---------- Wait for loading to finish ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(By.css('[data-testid="lr-loading"]'));
    return loaders.length === 0;
  }, 15000);

  console.log("✅ Leave requests fetch completed");

  /* ---------- Validate result state ---------- */
  const table = await driver.findElements(By.css('[data-testid="lr-table"]'));
  const empty = await driver.findElements(By.css('[data-testid="lr-empty"]'));
  const error = await driver.findElements(By.css('[data-testid="lr-error"]'));

  assert.ok(
    table.length > 0 || empty.length > 0,
    "Neither leave table nor empty state rendered"
  );

  if (table.length > 0) {
    console.log("📋 Leave requests table rendered");
  } else {
    console.log("ℹ️ No leave requests found for selected filters");
  }
});

/* =======================
   APPROVE PENDING LEAVE REQUEST (FIXED)
======================= */
it("should approve a pending leave request if exists", async function () {
  console.log("🧪 Checking for pending leave requests...");

  /* ---------- Wait for table or empty state ---------- */
  await driver.wait(async () => {
    const table = await driver.findElements(By.css('[data-testid="lr-table"]'));
    const empty = await driver.findElements(By.css('[data-testid="lr-empty"]'));
    return table.length > 0 || empty.length > 0;
  }, 15000);

  /* ---------- No requests case ---------- */
  const emptyState = await driver.findElements(By.css('[data-testid="lr-empty"]'));
  if (emptyState.length > 0) {
    console.log("ℹ️ No leave requests available");
    return;
  }

  /* ---------- Find rows ---------- */
  const rows = await driver.findElements(By.css('[data-testid^="lr-row-"]'));

  let approved = false;

  for (const row of rows) {
    const statusCell = await row.findElement(
      By.css('[data-testid^="lr-status-"]')
    );
    const status = (await statusCell.getText()).toLowerCase();

    if (status === "pending") {
      console.log("⏳ Pending request found");

      /* ---------- Click Approve ---------- */
      const approveBtn = await row.findElement(
        By.css('[data-testid^="lr-approve-btn-"]')
      );

      await driver.executeScript(
        "arguments[0].scrollIntoView({block:'center'});",
        approveBtn
      );
      await driver.wait(until.elementIsEnabled(approveBtn), 5000);
      await driver.executeScript("arguments[0].click();", approveBtn);

      console.log("✅ Approve button clicked");

      /* ---------- Wait for dialog ---------- */
      const dialog = await driver.wait(
        until.elementLocated(By.css('[data-testid="lr-dialog"]')),
        10000
      );
      await driver.wait(until.elementIsVisible(dialog), 5000);

      /* ---------- Comment input (PHASE-6 STYLE FIX) ---------- */
const commentInput = await driver.wait(
  until.elementLocated(
    By.css('[data-testid="lr-dialog-comment"] input')
  ),
  5000
);

await driver.wait(until.elementIsVisible(commentInput), 5000);
await driver.wait(until.elementIsEnabled(commentInput), 5000);

await commentInput.sendKeys("Approved via Selenium automation");

console.log("✍️ Comment added");


      /* ---------- Confirm ---------- */
      const confirmBtn = await driver.findElement(
        By.css('[data-testid="lr-dialog-confirm"]')
      );
      await driver.wait(until.elementIsEnabled(confirmBtn), 5000);
      await driver.executeScript("arguments[0].click();", confirmBtn);

      console.log("🚀 Approval confirmed");

      /* ---------- Snackbar ---------- */
      const snackbar = await driver.wait(
        until.elementLocated(By.css('[data-testid="lr-snackbar"]')),
        10000
      );
      await driver.wait(until.elementIsVisible(snackbar), 5000);

      const text = await snackbar.getText();
      assert.ok(
        text.toLowerCase().includes("approved"),
        "Approval snackbar not shown"
      );

      console.log("🎉 Leave request approved successfully");

      approved = true;
      break;
    }
  }

  if (!approved) {
    console.log("ℹ️ No pending leave requests found");
  }
});

/* =======================
   ATTENDANCE LOG – FILTER & FETCH
======================= */
it("should fetch attendance logs after selecting user and date range", async function () {
  console.log("🧪 Navigating to Attendance Log tab...");

  /* ---------- Click Attendance Log tab ---------- */
  const attendanceTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-attendance-log"]')),
    10000
  );
  await attendanceTab.click();

  /* ---------- Wait for Attendance Log page ---------- */
  await driver.wait(
    until.elementLocated(By.css('[data-testid="attendance-log-page"]')),
    10000
  );

  const title = await driver.findElement(
    By.css('[data-testid="title-attendance-log"]')
  );
  assert.strictEqual(await title.getText(), "Attendance Log");

  console.log("✅ Attendance Log tab loaded");

  /* ---------- Wait for User dropdown (slow API safe) ---------- */
  const userSelect = await driver.wait(
    until.elementLocated(By.css('[data-testid="select-user"]')),
    15000
  );
  await driver.wait(until.elementIsEnabled(userSelect), 15000);

  console.log("✅ User dropdown loaded");

  /* ---------- Select Admin User1 (MUI-safe) ---------- */
  await userSelect.click();

  const adminUser = await driver.wait(
    until.elementLocated(By.css('[data-testid="select-user-option-1"]')),
    10000
  );
  await adminUser.click();

  console.log("✅ Selected user: Admin User1");

  /* =======================
     MANUAL DATE PICKERS
  ======================= */

  /* ---------- Start Date ---------- */
  const startDateInput = await driver.wait(
    until.elementLocated(By.css('[data-testid="start-date"] input')),
    5000
  );
  await driver.executeScript("arguments[0].click();", startDateInput);

  console.log("⏱ Please manually select START date...");
  await driver.sleep(6000);

  /* ---------- End Date ---------- */
  const endDateInput = await driver.wait(
    until.elementLocated(By.css('[data-testid="end-date"] input')),
    5000
  );
  await driver.executeScript("arguments[0].click();", endDateInput);

  console.log("⏱ Please manually select END date...");
  await driver.sleep(6000);

  /* ---------- Wait for loading to start (if any) ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="loading-logs"]')
    );
    return loaders.length >= 0; // safe trigger
  }, 5000);

  /* ---------- Wait for loading to finish ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="loading-logs"]')
    );
    return loaders.length === 0;
  }, 15000);

  console.log("✅ Attendance logs fetch completed");

  /* ---------- Validate result state ---------- */
  const table = await driver.findElements(
    By.css('[data-testid="logs-table"]')
  );
  const empty = await driver.findElements(
    By.css('[data-testid="no-logs"]')
  );
  const error = await driver.findElements(
    By.css('[data-testid="logs-error"]')
  );

  assert.ok(
    table.length > 0 || empty.length > 0,
    "No attendance table or empty state rendered"
  );

  if (table.length > 0) {
    console.log("📋 Attendance logs table rendered");
  } else {
    console.log("ℹ️ No attendance logs found for selected filters");
  }
});

/* =======================
   KPI TAB – FILTER & FETCH
======================= */
it("should fetch KPI data after selecting user and date range", async function () {
  console.log("🧪 Navigating to KPI tab...");

  /* ---------- Click KPI tab ---------- */
  const kpiTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-kpi"]')),
    10000
  );
  await kpiTab.click();

  /* ---------- Wait for KPI page ---------- */
  await driver.wait(
    until.elementLocated(By.css('[data-testid="kpi-page"]')),
    10000
  );

  const title = await driver.findElement(
    By.css('[data-testid="kpi-title"]')
  );
  assert.strictEqual(
    await title.getText(),
    "KPI - Leave & Attendance Summary"
  );

  console.log("✅ KPI tab loaded");

  /* ---------- Wait for User dropdown (slow API safe) ---------- */
  const userSelect = await driver.wait(
    until.elementLocated(By.css('[data-testid="kpi-user-select"]')),
    15000
  );
  await driver.wait(until.elementIsEnabled(userSelect), 15000);

  console.log("✅ KPI user dropdown loaded");

  /* ---------- Select Admin User1 (MUI-safe) ---------- */
  await userSelect.click();

  const adminUser = await driver.wait(
    until.elementLocated(By.css('[data-testid="kpi-user-option-1"]')),
    10000
  );
  await adminUser.click();

  console.log("✅ Selected user: Admin User1");

  /* =======================
     MANUAL DATE PICKERS
     (EXTRA TIME GIVEN)
  ======================= */

  /* ---------- Start Date ---------- */
  const startDateInput = await driver.wait(
    until.elementLocated(By.css('[data-testid="kpi-start-date"] input')),
    5000
  );
  await driver.executeScript("arguments[0].click();", startDateInput);

  console.log("⏱ Please manually select KPI START date...");
  await driver.sleep(8000); // more time

  /* ---------- End Date ---------- */
  const endDateInput = await driver.wait(
    until.elementLocated(By.css('[data-testid="kpi-end-date"] input')),
    5000
  );
  await driver.executeScript("arguments[0].click();", endDateInput);

  console.log("⏱ Please manually select KPI END date...");
  await driver.sleep(8000); // more time

  /* ---------- Wait for loading to start (if any) ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="kpi-loading"]')
    );
    return loaders.length >= 0; // safe trigger
  }, 5000);

  /* ---------- Wait for loading to finish ---------- */
  await driver.wait(async () => {
    const loaders = await driver.findElements(
      By.css('[data-testid="kpi-loading"]')
    );
    return loaders.length === 0;
  }, 15000);

  console.log("✅ KPI data fetch completed");

  /* ---------- Validate result state ---------- */
  const table = await driver.findElements(
    By.css('[data-testid="kpi-table"]')
  );
  const noData = await driver.findElements(
    By.css('[data-testid="kpi-no-data"]')
  );
  const error = await driver.findElements(
    By.css('[data-testid="kpi-error"]')
  );

  assert.ok(
    table.length > 0 || noData.length > 0,
    "No KPI table or no-data state rendered"
  );

  if (table.length > 0) {
    console.log("📊 KPI table rendered successfully");
  } else {
    console.log("ℹ️ No KPI data found for selected filters");
  }
});

after(async function () {
    if (driver) {
      console.log("🚀 Closing browser...");
      await driver.quit(); // closes all tabs and ends session
  }
  });
});
