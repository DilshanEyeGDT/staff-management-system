const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("./config");

describe("Health Check Page UI Test (Admin User)", function () {
  this.timeout(90000);
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // STEP 1️⃣ — Open dashboard and inject admin token manually
    await driver.get(DASHBOARD_URL);
    await driver.executeScript(
      `window.localStorage.setItem('token', '${ACCESS_TOKEN}');`
    );
    await driver.navigate().refresh();

    // STEP 2️⃣ — Wait until admin portal visible
    await driver.wait(until.elementLocated(By.id("dashboard-side-panel")), 30000);

    const title = await driver.findElement(By.id("dashboard-title")).getText();
    assert.ok(title.includes("Admin Portal"), "Dashboard title mismatch");

    console.log("✅ Dashboard loaded and authorized as Admin");
  });

  it("should navigate to Health Check section", async function () {
    const healthButton = await driver.wait(
      until.elementLocated(By.id("nav-health")),
      20000,
      "Health navigation button not found"
    );
    await healthButton.click();

    await driver.wait(until.elementLocated(By.id("healthcheck-container")), 20000);
    const header = await driver.findElement(By.id("healthcheck-title")).getText();

    assert.ok(header.includes("System Health"), "Header text mismatch");
    console.log("✅ Navigated to Health Check section");
  });

  it("should display success or error alert after health check completes", async function () {
    try {
      const result = await driver.wait(
        until.elementLocated(By.id("healthcheck-success")),
        25000
      );
      const text = await result.getText();
      assert.ok(text.includes("Server is Healthy"), "Success alert not found");
      console.log("✅ Server is healthy (200 OK)");
    } catch {
      const errorAlert = await driver.wait(
        until.elementLocated(By.id("healthcheck-error")),
        5000
      );
      const text = await errorAlert.getText();
      assert.ok(
        text.includes("Server is not reachable") || text.includes("error"),
        "Error alert not found"
      );
      console.log("⚠️ Server health check failed but alert displayed correctly");
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });
});
