const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("./config");

describe("Admin Profile Section UI Test", function () {
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

  it("should display Profile section by default", async function () {
    // Default selected page = Profile
    await driver.wait(until.elementLocated(By.id("nav-profile")), 20000);
    
    // Wait for profile title
    const profileTitle = await driver.wait(
      until.elementLocated(By.xpath("//h5[text()='My Profile']")),
      10000,
      "Profile title not visible"
    );
    assert.ok(await profileTitle.isDisplayed(), "Profile title not visible");

    const welcomeText = await driver.findElement(By.xpath("//p[contains(text(), 'Welcome,')]")).getText();
    assert.ok(welcomeText.includes("Welcome"), "Welcome message not found");

    const roleText = await driver.findElement(By.xpath("//p[contains(text(), 'Role:')]")).getText();
    assert.ok(roleText.includes("Admin"), "Role should be Admin");

    console.log("✅ Profile section loaded correctly");
  });

  it("should enter edit mode when clicking 'Edit Display Name'", async function () {
    const editButton = await driver.findElement(By.id("edit-displayName-button"));
    await editButton.click();

    const inputField = await driver.wait(
      until.elementLocated(By.id("edit-displayName")),
      10000,
      "Edit input field not visible"
    );
    assert.ok(await inputField.isDisplayed(), "Edit input not displayed");

    console.log("✅ Entered edit mode successfully");
  });

  it("should update display name successfully", async function () {
    const input = await driver.findElement(By.id("edit-displayName"));
    await input.sendKeys(Key.CONTROL, "a"); // Select all
    await input.sendKeys(Key.BACK_SPACE); // Clear
    await input.sendKeys("Updated Admin Name");

    const saveBtn = await driver.findElement(By.id("save-displayName"));
    await saveBtn.click();

    // Wait for snackbar message
    await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'MuiSnackbar-root')]//div[text()='Display name updated successfully!']")),
      10000
    );

    // Wait for React to re-render
    await driver.wait(
      async () => {
        const text = await driver
          .findElement(By.xpath("//p[contains(text(), 'Welcome,')]"))
          .getText();
        return text.includes("Updated Admin Name");
      },
      20000,
      "Updated display name not visible after saving"
    );

    const updatedText = await driver
      .findElement(By.xpath("//p[contains(text(), 'Welcome,')]"))
      .getText();

    assert.ok(
      updatedText.includes("Updated Admin Name"),
      `Expected updated name in UI, got: ${updatedText}`
    );

    console.log("✅ Display name updated and verified successfully");
  });

  after(async function () {
    if (driver) {
      console.log("🧹 Closing browser...");
      await driver.quit();
    }
  });
});
