const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");
const { BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./config");

describe("Login & Logout Flow Tests", function () {
  this.timeout(120000); // Cognito + redirects
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  /* =======================
     TEST 1: LOGIN
  ======================= */
  it("should login and redirect to the dashboard", async function () {
    // 1. Go to login page
    await driver.get(BASE_URL);

    // 2. Click "Sign in with Cognito"
    const loginButton = await driver.wait(
      until.elementLocated(By.css("button")),
      10000
    );
    await loginButton.click();

    // 3. Wait for Cognito redirect
    await driver.wait(until.urlContains("cognito"), 15000);

    /**
     * Enable this if you automate Cognito login
     */

    // const emailField = await driver.wait(
    //   until.elementLocated(By.id("signInFormUsername")),
    //   10000
    // );
    // await emailField.sendKeys(ADMIN_EMAIL);

    // const passwordField = await driver.findElement(By.id("signInFormPassword"));
    // await passwordField.sendKeys(ADMIN_PASSWORD);

    // const signInBtn = await driver.findElement(By.name("signInSubmitButton"));
    // await signInBtn.click();

    // 4. Assert dashboard loaded
    const dashboardTitle = await driver.wait(
      until.elementLocated(By.id("dashboard-title")),
      30000
    );

    const titleText = await dashboardTitle.getText();
    assert.strictEqual(titleText, "Admin Portal");
  });

  /* =======================
     TEST 2: LOGOUT
  ======================= */
  it("should logout from the dashboard and redirect to login", async function () {
    // 1. Ensure side panel exists
    const sidePanel = await driver.wait(
      until.elementLocated(By.id("dashboard-side-panel")),
      10000
    );

    // 2. Scroll to bottom (logout button is at bottom)
    await driver.executeScript(
      "arguments[0].scrollTop = arguments[0].scrollHeight",
      sidePanel
    );

    // 3. Click Logout button
    const logoutButton = await driver.wait(
      until.elementLocated(By.id("logout-button")),
      10000
    );
    await logoutButton.click();

    // 4. Wait for logout confirmation dialog
    await driver.wait(
      until.elementLocated(By.css('[data-testid="logout-confirm-dialog"]')),
      10000
    );

    // 5. Confirm dialog title
    const dialogTitle = await driver.findElement(
      By.css('[data-testid="logout-dialog-title"]')
    );
    assert.strictEqual(await dialogTitle.getText(), "Confirm Logout");

    // 6. Confirm logout
    const confirmLogoutBtn = await driver.findElement(
      By.css('[data-testid="logout-confirm-button"]')
    );
    await confirmLogoutBtn.click();

    // 7. Assert redirected to login page
    const signInButtonAfterLogout = await driver.wait(
      until.elementLocated(By.css("button")),
      20000
    );

    await driver.wait(
      until.elementIsVisible(signInButtonAfterLogout),
      10000
    );

    assert.strictEqual(
      await signInButtonAfterLogout.isDisplayed(),
      true,
      "Sign in with Cognito button not visible after logout"
    );
  });
});
