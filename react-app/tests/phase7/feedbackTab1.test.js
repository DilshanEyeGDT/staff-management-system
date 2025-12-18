const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("./config");

describe("Feedback Tab UI test", function () {
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

  /* =======================
     NAVIGATION
  ======================= */
  it("should navigate to Feedbacks & Reporting page", async function () {
    const feedbackNav = await driver.findElement(
      By.id("nav-feedbacks")
    );
    await feedbackNav.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("feedback-report-title")),
      10000
    );

    assert.strictEqual(await pageTitle.getText(), "Feedback & Reports");
    console.log("✅ Feedbacks & Reporting page loaded");
  });

  /* =======================
     CREATE FEEDBACK
  ======================= */
  it("should create a feedback successfully", async function () {
    /* =======================
        OPEN CREATE DIALOG
    ======================= */

    await driver.wait(
        until.elementLocated(By.id("tab-content-feedback")),
        10000
    );

    const addFeedbackBtn = await driver.wait(
        until.elementLocated(By.css('[data-testid="add-feedback-floating-button"]')),
        10000
    );
    await addFeedbackBtn.click();

    /* =======================
        WAIT FOR DIALOG
    ======================= */

    const dialog = await driver.wait(
        until.elementLocated(By.css('[data-testid="create-feedback-dialog"]')),
        10000
    );
    await driver.wait(until.elementIsVisible(dialog), 10000);

    /* =======================
        TITLE (IMPORTANT FIX)
    ======================= */

    const titleInput = await driver.wait(
        until.elementLocated(
        By.css('[data-testid="feedback-title-input"] input')
        ),
        5000
    );
    await titleInput.sendKeys("Selenium Automation Feedback");

    /* =======================
        CATEGORY
    ======================= */

    const categoryInput = await driver.wait(
        until.elementLocated(
        By.css('[data-testid="feedback-category-input"] input')
        ),
        5000
    );
    await categoryInput.sendKeys("UI Testing");

    /* =======================
        PRIORITY (MUI SELECT FIX)
    ======================= */

    const prioritySelect = await driver.findElement(
        By.css('[data-testid="feedback-priority-select"]')
    );

    // MUI requires mouseDown, not click
    await driver.actions().move({ origin: prioritySelect }).press().release().perform();

    const mediumOption = await driver.wait(
        until.elementLocated(By.css('[data-testid="priority-option-medium"]')),
        5000
    );
    await mediumOption.click();

    /* =======================
        ASSIGNEE (MUI SELECT FIX)
    ======================= */

    // 1. Find the select wrapper
    // Open dropdown
        const assigneeSelect = await driver.findElement(By.css('[data-testid="feedback-assignee-select"]'));
        await assigneeSelect.click();

        // Wait for the first option to appear
        const firstOption = await driver.wait(
        until.elementLocated(By.css('[data-testid^="assignee-option-"]')),
        10000
        );
        await firstOption.click();

    /* =======================
        SUBMIT
    ======================= */

    const submitBtn = await driver.wait(
        until.elementLocated(By.css('[data-testid="create-feedback-submit-button"]')),
        10000
    );

    await driver.wait(until.elementIsEnabled(submitBtn), 10000);
    await submitBtn.click();

    /* =======================
        SUCCESS SNACKBAR
    ======================= */

    // 9. Wait for success snackbar
    const snackbar = await driver.wait(
    until.elementLocated(By.css('[data-testid="global-snackbar-alert"], [data-testid="feedback-snackbar-alert"]')),
    10000
    );

    // Wait until it’s visible
    await driver.wait(until.elementIsVisible(snackbar), 5000);

    const snackbarText = await snackbar.getText();

    assert.ok(
    snackbarText.toLowerCase().includes("success"),
    "Success snackbar not shown after creating feedback"
    );

    console.log("✅ Feedback created successfully");

    });

  it("should add a comment to a feedback successfully", async function () {
    // Wait for the feedback tab content
    await driver.wait(until.elementLocated(By.id("tab-content-feedback")), 10000);

    // Wait for feedback list to load
    await driver.wait(until.elementLocated(By.css('[data-testid^="feedback-card-"]')), 5000);

    // Select the first feedback card
    const firstFeedbackCard = await driver.findElement(By.css('[data-testid^="feedback-card-"]'));
    const feedbackId = await firstFeedbackCard
      .getAttribute("data-testid")
      .then((id) => id.split("-")[2]);

    // Click "Add Comment" button
    const addCommentBtn = await driver.findElement(
      By.css(`[data-testid="feedback-add-comment-button-${feedbackId}"]`)
    );
    await driver.wait(until.elementIsVisible(addCommentBtn), 5000);
    await driver.wait(until.elementIsEnabled(addCommentBtn), 5000);
    await addCommentBtn.click();

    // Wait for Add Comment dialog to appear
    const dialog = await driver.wait(
      until.elementLocated(By.css('[data-testid="add-comment-dialog"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(dialog), 10000);

    // Locate the actual textarea inside MUI TextField
    const commentInput = await driver.wait(
      until.elementLocated(By.css('[data-testid="add-comment-textfield"] textarea')),
      5000
    );
    await driver.wait(until.elementIsVisible(commentInput), 5000);
    await driver.wait(until.elementIsEnabled(commentInput), 5000);

    // Focus and type comment
    await commentInput.click();
    await commentInput.clear();
    await commentInput.sendKeys("This is a test comment");

    // Wait for and click Submit button
    const submitBtn = await driver.wait(
      until.elementLocated(By.css('[data-testid="add-comment-submit-button"]')),
      5000
    );
    await driver.wait(until.elementIsEnabled(submitBtn), 5000);
    await submitBtn.click();

    // Wait for snackbar confirmation
    const snackbar = await driver.wait(
      until.elementLocated(By.css('[data-testid="feedback-snackbar-alert"]')),
      5000
    );
    await driver.wait(until.elementTextContains(snackbar, "Comment added successfully!"), 5000);
  });

  it("should edit a feedback successfully", async function () {
    // Wait for feedback list to load
    await driver.wait(until.elementLocated(By.css('[data-testid^="feedback-card-"]')), 10000);

    // Select the first feedback card
    const firstFeedbackCard = await driver.findElement(By.css('[data-testid^="feedback-card-"]'));
    const feedbackId = await firstFeedbackCard.getAttribute("data-testid").then(id => id.split("-")[2]);

    // Click "Edit" button
    const editBtn = await driver.findElement(By.css(`[data-testid="feedback-edit-button-${feedbackId}"]`));
    await driver.wait(until.elementIsVisible(editBtn), 5000);
    await driver.wait(until.elementIsEnabled(editBtn), 5000);
    await editBtn.click();

    // Wait for Edit Feedback dialog
    const editDialog = await driver.wait(
      until.elementLocated(By.css('[data-testid="edit-feedback-dialog"]')),
      5000
    );
    await driver.wait(until.elementIsVisible(editDialog), 5000);

    // Change status to "In Progress"
    const statusSelect = await driver.findElement(By.css('[data-testid="edit-feedback-status-select"]'));
    await driver.wait(until.elementIsVisible(statusSelect), 5000);
    await statusSelect.click();

    const statusOption = await driver.findElement(By.css('[data-testid="edit-feedback-status-in-progress"]'));
    await driver.wait(until.elementIsVisible(statusOption), 5000);
    await statusOption.click();

    // Click Update
    const updateBtn = await driver.findElement(By.css('[data-testid="edit-feedback-submit-button"]'));
    await driver.wait(until.elementIsEnabled(updateBtn), 5000);
    await updateBtn.click();

    // Wait for snackbar to appear (with extra timeout for MUI transition)
    const snackbarAlert = await driver.wait(
      until.elementLocated(By.css('[data-testid="feedback-snackbar-alert"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(snackbarAlert), 5000);

    // Wait until snackbar text contains the success message
    await driver.wait(until.elementTextContains(snackbarAlert, "Feedback updated successfully"), 5000);
  });

  it("should open feedback details dialog and close on outside click", async function () {
    // Wait for feedback list
    await driver.wait(
      until.elementLocated(By.css('[data-testid^="feedback-card-"]')),
      10000
    );

    // Click first feedback card
    const firstFeedbackCard = await driver.findElement(
      By.css('[data-testid^="feedback-card-"]')
    );
    await firstFeedbackCard.click();

    // Wait for dialog to appear
    const detailsDialog = await driver.wait(
      until.elementLocated(By.css('[data-testid="feedback-details-dialog"]')),
      10000,
      "Feedback details dialog did not appear"
    );

    await driver.wait(until.elementIsVisible(detailsDialog), 5000);
    console.log("✅ Feedback details dialog opened");

    // Small delay to ensure backdrop animation finishes
    await driver.sleep(500);

    // Click outside dialog (top-left of page)
    await driver.actions({ bridge: true })
      .move({ x: 5, y: 5 }) // definitely outside dialog
      .click()
      .perform();

    // Wait for dialog to close
    await driver.wait(async () => {
      const dialogs = await driver.findElements(
        By.css('[data-testid="feedback-details-dialog"]')
      );
      return dialogs.length === 0;
    }, 10000, "Feedback details dialog did not close after outside click");

    console.log("✅ Feedback details dialog closed successfully");
  });

  after(async function () {
    if (driver) {
      console.log("🚀 Closing browser...");
      await driver.quit(); // closes all tabs and ends session
  }
  });

});
