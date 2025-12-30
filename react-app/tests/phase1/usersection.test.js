const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Admin Users Section UI Test", function () {
  this.timeout(90000);
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    console.log("🚀 Opening dashboard...");
    await driver.get(DASHBOARD_URL);

    // Inject valid admin token
    await driver.executeScript(`window.localStorage.setItem('token', '${ACCESS_TOKEN}');`);
    await driver.navigate().refresh();

    // Wait for dashboard sidebar
    await driver.wait(until.elementLocated(By.id("dashboard-side-panel")), 30000);

    const title = await driver.findElement(By.id("dashboard-title")).getText();
    assert.ok(title.includes("Admin Portal"), "Admin Portal title missing");
    console.log("✅ Dashboard loaded successfully as Admin");
  });

  it("should navigate to Users section", async function () {
    const usersNav = await driver.findElement(By.id("nav-users"));
    await usersNav.click();

    // Wait until user list table appears
    await driver.wait(until.elementLocated(By.xpath("//h6[text()='User List']")), 15000);
    const header = await driver.findElement(By.xpath("//h6[text()='User List']"));
    assert.ok(await header.isDisplayed(), "User List header not visible");

    // Verify at least one row exists
    const firstRow = await driver.wait(
      until.elementLocated(By.xpath("//table/tbody/tr")),
      15000,
      "No user rows found"
    );
    assert.ok(await firstRow.isDisplayed(), "No users found in the table");

    console.log("✅ Navigated to Users section and user table visible");
  });

  it("should open user details and display audit logs or 'No logs' message", async function () {
    // Click the first user row
    const firstRow = await driver.findElement(By.xpath("//table/tbody/tr[1]"));
    await driver.executeScript("arguments[0].scrollIntoView(true);", firstRow);
    await firstRow.click();

    // Wait for User Details view
    await driver.wait(
      until.elementLocated(By.xpath("//h6[text()='User Details']")),
      20000,
      "User Details view not loaded"
    );
    const detailsHeader = await driver.findElement(By.xpath("//h6[text()='User Details']"));
    assert.ok(await detailsHeader.isDisplayed(), "User Details header not shown");

    // Confirm essential info
    const emailField = await driver.findElement(By.xpath("//p[contains(text(), 'Email:')]"));
    assert.ok(await emailField.isDisplayed(), "Email field not visible in details");

    const displayNameField = await driver.findElement(By.xpath("//p[contains(text(), 'Display Name:')]"));
    assert.ok(await displayNameField.isDisplayed(), "Display Name not visible");

    // Verify audit logs presence (table or fallback text)
    let auditHeader;
    try {
      auditHeader = await driver.wait(
        until.elementLocated(By.xpath("//h6[text()='Audit Logs']")),
        10000
      );
      assert.ok(await auditHeader.isDisplayed(), "Audit Logs table not visible");
      console.log("✅ Audit Logs table visible for selected user");
    } catch {
      const noLogsMsg = await driver.findElement(
        By.xpath("//p[contains(text(), 'No audit logs available')]")
      );
      assert.ok(await noLogsMsg.isDisplayed(), "Expected 'No logs' message not visible");
      console.log("ℹ️ No audit logs available message shown (valid fallback)");
    }
  });

  it("should return back to Users list", async function () {
    const backButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Back to Users')]")
    );
    await backButton.click();

    await driver.wait(until.elementLocated(By.xpath("//h6[text()='User List']")), 10000);
    const tableVisible = await driver.findElement(By.xpath("//h6[text()='User List']"));
    assert.ok(await tableVisible.isDisplayed(), "User list not visible after going back");

    console.log("✅ Returned to Users list successfully");
  });

  after(async function () {
    if (driver) {
      console.log("🧹 Closing browser...");
      await driver.quit();
    }
  });
});
