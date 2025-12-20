const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Feedback Export Tab UI test", function () {
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
    it("should navigate to Feedbacks & Reporting page", async function () {
      const feedbackNav = await driver.findElement(
        By.id("nav-feedbacks")
      );
      await feedbackNav.click();
  
      const pageTitle = await driver.wait(
        until.elementLocated(By.id("feedback-report-title")),
        10000
      );
  
      assert.strictEqual(await pageTitle.getText(), "Feedback & Reports");
      console.log("✅ Feedbacks & Reporting page loaded");
    });

    // switch to Export Feedbacks tab, preview and export CSV
    
    it("should switch to Export Feedbacks tab, allow manual date selection, select status, preview and export CSV", async function () {
    // ================= Switch to Export Feedbacks tab =================
    const exportTab = await driver.wait(
        until.elementLocated(By.css('[data-testid="tab-export-feedbacks"]')),
        10000
    );
    await driver.executeScript("arguments[0].click();", exportTab);

    const container = await driver.wait(
        until.elementLocated(By.css('[data-testid="export-feedback-container"]')),
        10000
    );
    await driver.executeScript("arguments[0].scrollIntoView(true);", container);
    console.log("✅ Export Feedbacks tab opened");

    // ================= Click From DatePicker =================
    const fromDatePicker = await driver.findElement(By.css('[data-testid="export-feedback-from-date"]'));
    await driver.executeScript("arguments[0].click();", fromDatePicker);
    console.log("⏱ Please manually select the FROM date in the calendar...");
    await driver.sleep(8000); // wait for manual selection

    // ================= Click To DatePicker =================
    const toDatePicker = await driver.findElement(By.css('[data-testid="export-feedback-to-date"]'));
    await driver.executeScript("arguments[0].click();", toDatePicker);
    console.log("⏱ Please manually select the TO date in the calendar...");
    await driver.sleep(8000); // wait for manual selection

    // ================= Select Status =================
    const statusSelect = await driver.findElement(By.css('[data-testid="export-feedback-status-select"]'));
    await driver.executeScript("arguments[0].click();", statusSelect);
    await driver.sleep(500); // wait for dropdown animation

    // Wait for "In Progress" option in portal to appear
    const statusOption = await driver.findElement(By.css('[data-testid="export-feedback-status-select"]'));
    await driver.actions({ bridge: true }).move({ origin: statusSelect }).click().perform();
    await driver.sleep(500); // wait for dropdown animation
    await driver.executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", statusOption);

    console.log("✅ Status selected: In Progress");

    // ================= Click Preview =================
    const previewBtn = await driver.findElement(By.css('[data-testid="export-feedback-preview-button"]'));
    await driver.executeScript("arguments[0].click();", previewBtn);

    // Wait for preview rows
    await driver.wait(async () => {
        const rows = await driver.findElements(By.css('[data-testid^="export-feedback-preview-row-"]'));
        return rows.length > 0;
    }, 10000, "Preview did not load");
    console.log("✅ Preview loaded");

    // ================= Click Export CSV =================
    const exportBtn = await driver.findElement(By.css('[data-testid="export-feedback-export-button"]'));
    await driver.executeScript("arguments[0].click();", exportBtn);
    await driver.sleep(1000);
    console.log("✅ Export CSV clicked");
    });

    after(async function () {
    if (driver) {
        console.log("🚀 Closing browser...");
        await driver.quit(); // closes all tabs and ends session
    }
    });

});
