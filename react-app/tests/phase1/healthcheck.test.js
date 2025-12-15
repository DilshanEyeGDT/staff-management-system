const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("./config");

describe("Health Check Page UI Test (Admin User)", function () {
  this.timeout(120000); // increased timeout for multiple health checks
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // STEP 1 — Open dashboard and inject admin token manually
    await driver.get(DASHBOARD_URL);
    await driver.executeScript(
      `window.localStorage.setItem('token', '${ACCESS_TOKEN}');`
    );
    await driver.navigate().refresh();

    // STEP 2 — Wait until admin portal is visible
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
    assert.ok(header.includes("Systems Health"), "Header text mismatch");

    console.log("✅ Navigated to Health Check section");
  });

  it("should display system health alerts correctly", async function () {
    // Function to wait for either success or error alert for a system
    async function checkSystemHealth(systemName) {
      const successAlertXpath = `//h6[contains(text(), '${systemName}')]/following-sibling::div[contains(@class,'MuiAlert-standardSuccess')]`;
      const errorAlertXpath = `//h6[contains(text(), '${systemName}')]/following-sibling::div[contains(@class,'MuiAlert-standardError')]`;

      try {
        const successAlert = await driver.wait(
          until.elementLocated(By.xpath(successAlertXpath)),
          20000
        );
        const text = await successAlert.getText();
        console.log(`✅ ${systemName} healthy: "${text}"`);
      } catch {
        const errorAlert = await driver.wait(
          until.elementLocated(By.xpath(errorAlertXpath)),
          5000
        );
        const text = await errorAlert.getText();
        console.log(`⚠️ ${systemName} unhealthy: "${text}"`);
        assert.ok(
          text.length > 0,
          `${systemName} health check failed but no alert message found`
        );
      }
    }

    await checkSystemHealth("Authentication System");
    // await checkSystemHealth("AWS Lambda System");
    // await checkSystemHealth("ASP.NET Backend System");
    // await checkSystemHealth("Go Backend System");
  });

  after(async function () {
    if (driver) {
      console.log("🧹 Closing browser...");
      await driver.quit();
    }
  });
});
