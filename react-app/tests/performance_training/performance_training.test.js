const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000"; // login page URL

describe("Performance & Training Page Test", function () {
  this.timeout(180000); // 3 minutes to allow manual login

  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // Step 1: Go to Login page
    await driver.get(BASE_URL);

    // Step 2: Click "Sign in with Cognito"
    const loginButton = await driver.findElement(By.css("button"));
    await loginButton.click();

    console.log("Please manually enter your Cognito credentials in the browser...");

    // Step 3: Wait for Performance & Training option to appear in sidebar
    const perfTrainingOption = await driver.wait(
      until.elementLocated(By.id("nav-performanceTraining")),
      60000
    );
    assert.ok(await perfTrainingOption.isDisplayed(), "Performance & Training option is visible in sidebar");
    console.log("Login successful, dashboard loaded!");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("should display Performance & Training side panel option", async function () {
    const perfTrainingOption = await driver.findElement(By.id("nav-performanceTraining"));
    assert.ok(await perfTrainingOption.isDisplayed(), "Performance & Training option is visible");
  });

  it("should load Performance & Training page and default tab", async function () {
    const perfTrainingOption = await driver.findElement(By.id("nav-performanceTraining"));
    await perfTrainingOption.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("performance-training-title")),
      5000
    );
    assert.strictEqual(await pageTitle.getText(), "Performace & Training");

    const tabs = await driver.findElement(By.id("performance-training-tabs"));
    assert.ok(await tabs.isDisplayed(), "Tabs are visible");

    // Check default tab - Training Courses
    const trainingContent = await driver.findElement(By.id("tab-content-training"));
    assert.ok(await trainingContent.isDisplayed(), "Training Courses tab content is visible");

    const searchBar = await driver.findElement(By.id("training-search-bar"));
    assert.ok(await searchBar.isDisplayed(), "Search bar is visible in Training Courses tab");

    console.log("Default Training Courses tab loaded successfully.");
  });

  it("should load Assign Target KPIs tab correctly", async function () {
    const targetTab = await driver.findElement(By.id("tab-target-kpis"));
    await targetTab.click();

    const subtitle = await driver.wait(
      until.elementLocated(By.id("tab-assign-kpi-subtitle")),
      5000
    );
    assert.ok(await subtitle.isDisplayed(), "Assign Target KPIs subtitle is visible");

    console.log("Assign Target KPIs tab loaded successfully.");
  });

  it("should load KPI Snapshots tab correctly", async function () {
    const kpiTab = await driver.findElement(By.id("tab-kpi-snapshots"));
    await kpiTab.click();

    const userSelect = await driver.wait(
      until.elementLocated(By.id("user-select-label")),
      5000
    );
    assert.ok(await userSelect.isDisplayed(), "User select dropdown is visible in KPI Snapshots tab");

    console.log("KPI Snapshots tab loaded successfully.");
  });

  it("should load Import Actual KPIs tab correctly", async function () {
    const importTab = await driver.findElement(By.id("tab-import"));
    await importTab.click();

    const uploadBtn = await driver.wait(
      until.elementLocated(By.id("upload-csv-button")),
      5000
    );
    assert.ok(await uploadBtn.isDisplayed(), "Upload button is visible in Import Actual KPIs tab");

    console.log("Import Actual KPIs tab loaded successfully.");
  });
});
