const { Builder, By, until, Key } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");
const { BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./config");

describe("Login Flow Test", function () {
  this.timeout(90000); // 90s for redirect + dashboard load
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it("should log in via Cognito and load Dashboard", async function () {
    // 1. Go to React login page
    await driver.get(BASE_URL);

    // 2. Click "Sign in with Cognito"
    const loginButton = await driver.findElement(By.css("button"));
    await loginButton.click();

    // 3. Wait for Cognito login page
    await driver.wait(until.urlContains("cognito"), 10000);

    // // 4. Enter Cognito credentials
    // const emailField = await driver.wait(until.elementLocated(By.id("signInFormUsername")), 5000);
    // await emailField.sendKeys(ADMIN_EMAIL);

    // const passwordField = await driver.findElement(By.id("signInFormPassword"));
    // await passwordField.sendKeys(AdMIN_PASSWORD);

    // // 5. Click Sign in (using name attribute)
    // const signInBtn = await driver.findElement(By.name("signInSubmitButton"));
    // await signInBtn.click();

    // 6. Wait for dashboard to load (wait for sidebar title element)
    const dashboardTitle = await driver.wait(
      until.elementLocated(By.id("dashboard-title")),
      20000
    );

    // 7. Assert dashboard loaded
    const titleText = await dashboardTitle.getText();
    assert.strictEqual(titleText, "Admin Portal");
  });
});
