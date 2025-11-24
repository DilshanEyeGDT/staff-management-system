const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000"; // login page URL

describe("Admin Dashboard & Leave/Attendance Tabs Test", function () {
  this.timeout(180000); // 3 minutes to allow manual login and page loads

  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // Step 1: Go to Login page
    await driver.get(BASE_URL);

    // Step 2: Click "Sign in with Cognito"
    const loginButton = await driver.findElement(By.css("button"));
    await loginButton.click();

    console.log("Please manually enter your Cognito credentials in the browser...");

    // Step 3: Wait for dashboard to load
    const dashboardTitle = await driver.wait(
      until.elementLocated(By.id("dashboard-title")),
      60000
    );
    const titleText = await dashboardTitle.getText();
    assert.strictEqual(titleText, "Admin Portal");
    console.log("Login successful, dashboard loaded!");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("should display Leave & Attendance side panel option", async function () {
    const leaveTabButton = await driver.findElement(By.id("nav-leaveAttendance"));
    assert.ok(await leaveTabButton.isDisplayed(), "Leave & Attendance option is visible in sidebar");
  });

  it("should load Leave Requests tab correctly", async function () {
    const leaveTabButton = await driver.findElement(By.id("nav-leaveAttendance"));
    await leaveTabButton.click();

    const tabLeave = await driver.findElement(By.id("tab-leave-requests"));
    await tabLeave.click();

    const leaveTitle = await driver.wait(
      until.elementLocated(By.id("leave-requests-title")),
      5000
    );
    assert.strictEqual(await leaveTitle.getText(), "Leave Requests");
    console.log("Leave Requests tab loaded successfully.");
  });

  it("should load Attendance Log tab correctly", async function () {
    const tabAttendance = await driver.findElement(By.id("tab-attendance-log"));
    await tabAttendance.click();

    const attendanceTitle = await driver.wait(
      until.elementLocated(By.id("title-attendance-log")),
      5000
    );
    assert.strictEqual(await attendanceTitle.getText(), "Attendance Log");
    console.log("Attendance Log tab loaded successfully.");
  });

  it("should load KPI tab correctly", async function () {
    const tabKPI = await driver.findElement(By.id("tab-kpi"));
    await tabKPI.click();

    const kpiTitle = await driver.wait(
      until.elementLocated(By.id("kpi-title")),
      5000
    );
    assert.strictEqual(await kpiTitle.getText(), "KPI - Leave & Attendance Summary");
    console.log("KPI tab loaded successfully.");
  });
});
