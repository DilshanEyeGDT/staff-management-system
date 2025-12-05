const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000"; // login page URL

describe("Admin Dashboard & Tasks & Schedules Tabs Test", function () {
  this.timeout(180000); // 3 minutes to allow manual login and page loads

  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // Step 1: Go to Login page
    await driver.get(BASE_URL);

    // Step 2: Click "Sign in with Cognito" button
    const loginButton = await driver.findElement(By.css("button"));
    await loginButton.click();

    console.log("Please manually enter your Cognito credentials in the browser...");

    // Step 3: Wait for dashboard to load
    const dashboardOption = await driver.wait(
      until.elementLocated(By.id("nav-tasksSchedules")),
      60000
    );
    assert.ok(await dashboardOption.isDisplayed(), "Tasks & Schedules option is visible in sidebar");
    console.log("Login successful, dashboard loaded!");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("should display Tasks & Schedules side panel option", async function () {
    const tasksSchedulesOption = await driver.findElement(By.id("nav-tasksSchedules"));
    assert.ok(await tasksSchedulesOption.isDisplayed(), "Tasks & Schedules option is visible");
  });

  it("should load Schedules tab correctly", async function () {
    const tasksSchedulesOption = await driver.findElement(By.id("nav-tasksSchedules"));
    await tasksSchedulesOption.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("task-schedule-title")),
      5000
    );
    assert.strictEqual(await pageTitle.getText(), "Tasks & Schedules");

    const schedulesTab = await driver.findElement(By.id("tab-schedules"));
    assert.ok(await schedulesTab.isDisplayed(), "Schedules tab is visible");

    const schedulesContent = await driver.findElement(By.id("tab-content-schedules"));
    assert.ok(await schedulesContent.isDisplayed(), "Schedules tab content is visible");

    const userFilter = await driver.findElement(By.id("user-filter-control"));
    assert.ok(await userFilter.isDisplayed(), "User filter dropdown is visible in Schedules tab");

    console.log("Schedules tab loaded successfully.");
  });

  it("should load Tasks tab correctly", async function () {
    const tasksTab = await driver.findElement(By.id("tab-tasks"));
    await tasksTab.click();

    const tasksContent = await driver.wait(
      until.elementLocated(By.id("tab-content-tasks")),
      5000
    );
    assert.ok(await tasksContent.isDisplayed(), "Tasks tab content is visible");

    const assigneeFilter = await driver.findElement(By.id("assignee-filter-select"));
    assert.ok(await assigneeFilter.isDisplayed(), "Assignee filter dropdown is visible in Tasks tab");

    console.log("Tasks tab loaded successfully.");
  });

  it("should load Import tab correctly", async function () {
    const importTab = await driver.findElement(By.id("tab-import"));
    await importTab.click();

    const importContent = await driver.wait(
      until.elementLocated(By.id("tab-content-import")),
      5000
    );
    assert.ok(await importContent.isDisplayed(), "Import tab content is visible");

    const csvInput = await driver.findElement(By.id("csv-file-input"));
    const uploadBtn = await driver.findElement(By.id("upload-csv-button"));
    const checkStatusBtn = await driver.findElement(By.id("check-status-button"));

    assert.ok(await csvInput.isDisplayed(), "CSV file input is visible");
    assert.ok(await uploadBtn.isDisplayed(), "Upload CSV button is visible");
    assert.ok(await checkStatusBtn.isDisplayed(), "Check Status button is visible");

    console.log("Import tab loaded successfully.");
  });
});
