const { Builder, By, until, Select } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");
const { ACCESS_TOKEN, BASE_URL, DASHBOARD_URL } = require("./config");

describe("Role Assign Section UI Test (Admin User)", function () {
  this.timeout(80000);
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // Inject token
    await driver.get(BASE_URL);
    await driver.executeScript(`window.localStorage.setItem('token', '${ACCESS_TOKEN}');`);

    // Go to dashboard
    await driver.get(DASHBOARD_URL);

    // Wait for dashboard to load
    await driver.wait(until.elementLocated(By.id("dashboard-title")), 20000);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("should navigate to Role Assign section", async function () {
    const navRoleAssign = await driver.wait(
      until.elementLocated(By.id("nav-roleAssign")),
      20000
    );
    await navRoleAssign.click();

    // Wait for role assign table
    await driver.wait(until.elementLocated(By.xpath("//table")), 20000);
    const header = await driver.findElement(By.xpath("//h6[contains(text(),'Assign Roles')]"));
    const text = await header.getText();
    assert.strictEqual(text.trim(), "Assign Roles");
  });

  it("should list users with dropdown and save buttons", async function () {
    // Ensure at least one user row exists
    const userRows = await driver.findElements(By.xpath("//table/tbody/tr"));
    assert.ok(userRows.length > 0, "No users found in Role Assign section");

    // Check dropdown and save icon for the first non-admin user
    let targetRow;
    for (let i = 1; i <= userRows.length; i++) {
      const emailCell = await driver.findElement(By.xpath(`//table/tbody/tr[${i}]/td[1]`));
      const email = await emailCell.getText();
      if (email.trim().toLowerCase() !== "testuser@example.com") {
        targetRow = i;
        break;
      }
    }

    assert.ok(targetRow, "No non-admin user found for testing role change");

    const selectElement = await driver.findElement(By.id(`role-select-${targetRow}`));
    const saveButton = await driver.findElement(By.id(`save-role-${targetRow}`));

    assert.ok(await selectElement.isDisplayed(), "Role dropdown not visible");
    assert.ok(await saveButton.isDisplayed(), "Save button not visible");
  });

  it("should change a user role successfully", async function () {
    // ✅ Wait for at least one user row
    const firstRow = await driver.wait(
      until.elementLocated(By.css("table tbody tr")),
      30000,
      "User row not found"
    );

    // ✅ Locate the Select trigger (MUI renders it as a button)
    const selectTrigger = await firstRow.findElement(By.css("[id^='role-select-']"));
    await selectTrigger.click();

    // ✅ Wait for dropdown menu and choose a role (e.g., Employee)
    const option = await driver.wait(
      until.elementLocated(By.xpath("//li[contains(., 'Employee')]")),
      10000,
      "Dropdown option not found"
    );
    await option.click();

    // ✅ Click save icon
    const saveBtn = await firstRow.findElement(By.css("[id^='save-role-']"));
    await saveBtn.click();

    // ✅ Wait for Snackbar message to appear
    const snackbar = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(., 'Role updated successfully!')]")),
      10000,
      "Snackbar message not found"
    );

    const msg = await snackbar.getText();
    assert.ok(msg.includes("Role updated successfully!"), "Role update message not shown");
  });


});
