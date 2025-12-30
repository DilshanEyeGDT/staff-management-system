const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");
const { ACCESS_TOKEN, BASE_URL, DASHBOARD_URL } = require("../config");

describe("Dashboard Page UI Test (Admin User)", function () {
  this.timeout(60000); // 1 minute timeout (since backend calls may take time)
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // ✅ Inject the token directly into localStorage before loading dashboard
    await driver.get(BASE_URL);
    await driver.executeScript(`window.localStorage.setItem('token', '${ACCESS_TOKEN}');`);

    // ✅ Now go to the dashboard
    await driver.get(DASHBOARD_URL);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("should display the Admin Portal title", async function () {
    const titleElement = await driver.wait(
      until.elementLocated(By.id("dashboard-title")),
      20000
    );
    const text = await titleElement.getText();
    assert.strictEqual(text.trim(), "Admin Portal");
  });

  it("should display sidebar navigation buttons", async function () {
    const navProfile = await driver.findElement(By.id("nav-profile"));
    const navUsers = await driver.findElement(By.id("nav-users"));
    const navRoleAssign = await driver.findElement(By.id("nav-roleAssign"));
    const navHealth = await driver.findElement(By.id("nav-health"));

    assert.ok(await navProfile.isDisplayed(), "Profile button missing");
    assert.ok(await navUsers.isDisplayed(), "Users button missing");
    assert.ok(await navRoleAssign.isDisplayed(), "Role Assign button missing");
    assert.ok(await navHealth.isDisplayed(), "Health button missing");
  });

  it("should navigate between sections (Profile → Users → RoleAssign → Health)", async function () {
    const buttons = ["nav-profile", "nav-users", "nav-roleAssign", "nav-health"];

    for (const id of buttons) {
      const button = await driver.findElement(By.id(id));
      await button.click();
      await driver.sleep(1000); // small wait for re-render
      assert.ok(await button.isDisplayed(), `Failed to click ${id}`);
    }
  });

// Logout test is commented out for now since logout URL is handled by Spring Boot backend
//   it("should successfully logout and redirect", async function () {
//     const logoutButton = await driver.findElement(By.id("logout-button"));
//     await logoutButton.click();

//     // wait for logout redirect (to Spring Boot logout URL)
//     await driver.wait(
//       until.urlContains("http://localhost:8080/logout"),
//       15000
//     );
//     const currentUrl = await driver.getCurrentUrl();
//     assert.ok(
//       currentUrl.includes("logout"),
//       `Expected logout redirect, but got ${currentUrl}`
//     );
//   });
});
