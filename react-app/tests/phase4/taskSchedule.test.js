const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
require("chromedriver");
const { ACCESS_TOKEN, DASHBOARD_URL } = require("../config");

describe("Task & Schedule UI test", function () {
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
  it("should navigate to Task & Schedule page", async function () {
    const feedbackNav = await driver.findElement(
      By.id("nav-tasksSchedules")
    );
    await feedbackNav.click();

    const pageTitle = await driver.wait(
      until.elementLocated(By.id("task-schedule-title")),
      10000
    );

    assert.strictEqual(await pageTitle.getText(), "Tasks & Schedules");
    console.log("✅ Task & Schedule page loaded");
  });

  /* =======================
   SCHEDULES TAB – FILTER BY USER
======================= */
it("should be on Schedules tab and filter schedules by user Tharaka", async function () {
  // 1️⃣ Verify we are on Schedules tab (tab-content visible)
  const schedulesTabContent = await driver.wait(
    until.elementLocated(By.id("tab-content-schedules")),
    10000
  );
  assert.ok(schedulesTabContent, "Schedules tab content not visible");
  console.log("✅ Schedules tab is active");

  // 2️⃣ Wait for loading to finish (dropdown takes ~5s)
  await driver.wait(
    async () => {
      const loaders = await driver.findElements(By.id("loading-box"));
      return loaders.length === 0;
    },
    15000,
    "Schedules loading did not finish"
  );

  // 3️⃣ Open 'Filter by User' dropdown
  const userFilterSelect = await driver.wait(
    until.elementLocated(By.id("user-filter-select")),
    10000
  );
  await userFilterSelect.click();

  // 4️⃣ Select user 'Tharaka'
  // (Assumes displayName is exactly "Tharaka")
  const tharakaOption = await driver.wait(
    until.elementLocated(
      By.xpath("//li[contains(text(), 'Tharaka')]")
    ),
    10000
  );
  await tharakaOption.click();
  console.log("✅ User filter set to Tharaka");

  // 5️⃣ Wait for schedules to refresh (either rows OR empty alert)
  await driver.wait(
    async () => {
      const rows = await driver.findElements(
        By.css("[data-testid^='schedule-row-']")
      );
      const emptyAlert = await driver.findElements(
        By.id("no-schedules-alert")
      );
      return rows.length > 0 || emptyAlert.length > 0;
    },
    15000,
    "Schedules were not updated after filtering"
  );

  console.log("✅ Schedules fetched successfully for user Tharaka");
});

  /* =======================
   CREATE NEW SCHEDULE
======================= */
it("should create a new schedule successfully", async function () {

  /* =======================
     OPEN CREATE DIALOG
  ======================= */
  const createFab = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-schedule-fab"]')
    ),
    10000
  );

  await driver.executeScript("arguments[0].click();", createFab);
  console.log("➕ Create Schedule FAB clicked");

  /* =======================
     WAIT FOR DIALOG
  ======================= */
  const dialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-schedule-dialog"]')
    ),
    10000
  );
  await driver.wait(until.elementIsVisible(dialog), 5000);

  console.log("🪟 Create Schedule dialog opened");

  /* =======================
     🔒 LOCK DIALOG FOCUS (CRITICAL)
  ======================= */
  const dialogContent = await driver.findElement(
    By.css('[data-testid="create-schedule-content"]')
  );

  // Click inside dialog to prevent backdrop-close
  await driver.executeScript("arguments[0].click();", dialogContent);

  // Give MUI time to finish async re-renders
  await driver.sleep(1000);

  /* =======================
     FILL FORM FIELDS
  ======================= */
  const timestamp = Date.now();

  const titleInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="schedule-title-input"] input')
    ),
    5000
  );
  await driver.wait(until.elementIsEnabled(titleInput), 5000);
  await titleInput.sendKeys(`Automation Schedule Test`);

  const descriptionInput = await driver.findElement(
    By.css('[data-testid="schedule-description-input"]  input')
  );
  await descriptionInput.sendKeys("Created via Selenium automation");

  /* =======================
   ASSIGNEE → THARAKA (MUI FIX)
======================= */
const assigneeSelect = await driver.findElement(
  By.css('[data-testid="schedule-assignee-select"]')
);

// 🔑 MUI Select requires mouseDown, not click
await driver.actions()
  .move({ origin: assigneeSelect })
  .press()
  .release()
  .perform();

// Wait for dropdown options (rendered in portal)
const tharakaOption = await driver.wait(
  until.elementLocated(
    By.xpath("//li[contains(text(),'Tharaka')]")
  ),
  10000
);

await tharakaOption.click();
console.log("👤 Assignee selected: Tharaka");

  /* =======================
     RECURRENCE
  ======================= */
//   const recurrenceSelect = await driver.findElement(
//   By.css('[data-testid="schedule-recurrence-select"]')
// );

// await driver.actions()
//   .move({ origin: recurrenceSelect })
//   .press()
//   .release()
//   .perform();

// await driver.findElement(
//   By.css('[data-testid="schedule-recurrence-WEEKLY"]')
// ).click();

  /* =======================
     LOCATION
  ======================= */
  await driver.findElement(
    By.css('[data-testid="schedule-location-input"] input')
  ).sendKeys("NewYork");

  /* =======================
     IMPORTANCE
  ======================= */
//   const importanceSelect = await driver.findElement(
//   By.css('[data-testid="schedule-importance-select"]')
// );

// await driver.actions()
//   .move({ origin: importanceSelect })
//   .press()
//   .release()
//   .perform();

// await driver.findElement(
//   By.css('[data-testid="schedule-importance-high"]')
// ).click();

  /* =======================
     START DATE (MANUAL)
  ======================= */
  const startDateInput = await driver.findElement(
    By.css('[data-testid="schedule-start-time-input"] input')
  );
  await driver.executeScript("arguments[0].click();", startDateInput);
  console.log("⏱ Select START date manually...");
  await driver.sleep(10000);

  /* =======================
     END DATE (MANUAL)
  ======================= */
  const endDateInput = await driver.findElement(
    By.css('[data-testid="schedule-end-time-input"] input')
  );
  await driver.executeScript("arguments[0].click();", endDateInput);
  console.log("⏱ Select END date manually...");
  await driver.sleep(10000);

  /* =======================
     SUBMIT
  ======================= */
  const createButton = await driver.findElement(
    By.css('[data-testid="create-schedule-submit-button"]')
  );
  await driver.wait(until.elementIsEnabled(createButton), 5000);
  await driver.executeScript("arguments[0].click();", createButton);

  console.log("🚀 Create Schedule submitted");

  /* =======================
     WAIT FOR CLOSE
  ======================= */
  await driver.wait(until.stalenessOf(dialog), 15000);

  console.log("✅ Schedule created successfully");
});

/* =======================
   EDIT CREATED SCHEDULE
======================= */
it("should edit start and end time of the created schedule", async function () {

  /* =======================
     WAIT FOR SCHEDULE TABLE
  ======================= */
  await driver.wait(
    until.elementLocated(By.css('[data-testid="schedules-table"]')),
    10000
  );

  /* =======================
     FIND CREATED SCHEDULE ROW
     (by title text)
  ======================= */
  const scheduleRow = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//td[contains(text(),'Automation Schedule Test')]/ancestor::tr"
      )
    ),
    10000
  );

  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", scheduleRow);
  await driver.executeScript("arguments[0].click();", scheduleRow);

  console.log("✏️ Schedule row clicked");

  /* =======================
     WAIT FOR EDIT DIALOG
  ======================= */
  const dialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="edit-schedule-dialog"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(dialog), 5000);
  console.log("🪟 Edit Schedule dialog opened");

  /* =======================
     VERIFY FIELDS ARE PREFILLED
  ======================= */
  const startInput = await driver.findElement(
    By.css('[data-testid="edit-schedule-start-time-input"] input')
  );

  const endInput = await driver.findElement(
    By.css('[data-testid="edit-schedule-end-time-input"] input')
  );

  const existingStart = await startInput.getAttribute("value");
  const existingEnd = await endInput.getAttribute("value");

  if (!existingStart || !existingEnd) {
    throw new Error("Start or End time not pre-filled in edit dialog");
  }

  console.log("✅ Start & End times are pre-filled");

  /* =======================
     UPDATE START DATE (MANUAL)
  ======================= */
  await driver.executeScript("arguments[0].click();", startInput);
  console.log("⏱ Please manually update START date & time...");
  await driver.sleep(10000);

  /* =======================
     UPDATE END DATE (MANUAL)
  ======================= */
  await driver.executeScript("arguments[0].click();", endInput);
  console.log("⏱ Please manually update END date & time...");
  await driver.sleep(10000);

  /* =======================
     CLICK UPDATE
  ======================= */
  const updateButton = await driver.findElement(
    By.css('[data-testid="edit-schedule-update-button"]')
  );

  await driver.wait(until.elementIsEnabled(updateButton), 5000);
  await driver.executeScript("arguments[0].click();", updateButton);

  console.log("🚀 Update button clicked");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="schedule-snackbar-alert"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  if (!snackbarText.toLowerCase().includes("updated")) {
    throw new Error("Schedule update success snackbar not shown");
  }

  console.log("🎉 Schedule updated successfully");

  /* =======================
     WAIT FOR DIALOG CLOSE
  ======================= */
  await driver.wait(until.stalenessOf(dialog), 10000);
});

/* =======================
   DELETE CREATED SCHEDULE
======================= */
it("should delete the created schedule successfully", async function () {

  /* =======================
     WAIT FOR SCHEDULE TABLE
  ======================= */
  await driver.wait(
    until.elementLocated(By.css('[data-testid="schedules-table"]')),
    10000
  );

  /* =======================
     FIND CREATED SCHEDULE
  ======================= */
  const scheduleRow = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//td[contains(text(),'Automation Schedule Test')]/ancestor::tr"
      )
    ),
    10000
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    scheduleRow
  );
  await driver.executeScript("arguments[0].click();", scheduleRow);

  console.log("🗑️ Schedule row clicked for deletion");

  /* =======================
     WAIT FOR EDIT DIALOG
  ======================= */
  const editDialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="edit-schedule-dialog"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(editDialog), 5000);
  console.log("🪟 Edit Schedule dialog opened");

  /* =======================
     CLICK DELETE BUTTON
  ======================= */
  const deleteButton = await driver.findElement(
    By.css('[data-testid="edit-schedule-delete-button"]')
  );

  await driver.wait(until.elementIsEnabled(deleteButton), 5000);
  await driver.executeScript("arguments[0].click();", deleteButton);

  console.log("⚠️ Delete button clicked");

  /* =======================
     DELETE CONFIRMATION DIALOG
  ======================= */
  const confirmDialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="delete-schedule-confirm-dialog"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(confirmDialog), 5000);
  console.log("❗ Delete confirmation dialog opened");

  /* =======================
     CONFIRM DELETE
  ======================= */
  const confirmDeleteButton = await driver.findElement(
    By.css('[data-testid="delete-schedule-confirm-delete"]')
  );

  await driver.wait(until.elementIsEnabled(confirmDeleteButton), 5000);
  await driver.executeScript("arguments[0].click();", confirmDeleteButton);

  console.log("🗑️ Confirm delete clicked");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="schedule-snackbar-alert"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  if (!snackbarText.toLowerCase().includes("deleted")) {
    throw new Error("Schedule delete success snackbar not shown");
  }

  console.log("🎉 Schedule deleted successfully");

  /* =======================
     WAIT FOR DIALOG CLOSE
  ======================= */
  await driver.wait(until.stalenessOf(editDialog), 10000);

});

/* =======================
   CREATE NEW TASK
======================= */
it("should create a new task successfully", async function () {

  /* =======================
     GO TO TASKS TAB
  ======================= */
  const tasksTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-tasks"]')),
    10000
  );
  await tasksTab.click();

  await driver.wait(
    until.elementLocated(By.id("tab-content-tasks")),
    10000
  );

  console.log("📋 Tasks tab opened");

  /* =======================
     OPEN CREATE TASK DIALOG
  ======================= */
  const createTaskFab = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-task-fab"]')
    ),
    10000
  );

  await driver.executeScript("arguments[0].click();", createTaskFab);
  console.log("➕ Create Task FAB clicked");

  /* =======================
     WAIT FOR DIALOG
  ======================= */
  const dialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-task-dialog"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(dialog), 5000);
  console.log("🪟 Create Task dialog opened");

  /* =======================
     FILL FORM FIELDS
  ======================= */
  const timestamp = Date.now();

  // Title
  await driver.findElement(
    By.css('[data-testid="task-title-input"] input')
  ).sendKeys(`Automation Task`);

  // Description
  await driver.findElement(
    By.css('[data-testid="task-description-input"] textarea')
  ).sendKeys("Created via Selenium automation");

  /* =======================
     ASSIGNEE → THARAKA (MUI FIX)
  ======================= */
  const assigneeSelect = await driver.findElement(
    By.css('[data-testid="task-assignee-select"]')
  );

  await driver.actions()
    .move({ origin: assigneeSelect })
    .press()
    .release()
    .perform();

  const tharakaOption = await driver.wait(
    until.elementLocated(
      By.xpath("//li[contains(text(),'Tharaka')]")
    ),
    10000
  );

  await tharakaOption.click();
  console.log("👤 Assignee selected: Tharaka");

  /* =======================
     DUE DATE (MANUAL)
  ======================= */
  const dueDateInput = await driver.findElement(
    By.css('[data-testid="task-due-date-input"] input')
  );

  await driver.executeScript("arguments[0].click();", dueDateInput);
  console.log("⏱ Select DUE date manually...");
  await driver.sleep(10000);

  /* =======================
     SUBMIT TASK
  ======================= */
  const submitButton = await driver.findElement(
    By.css('[data-testid="create-task-submit-button"]')
  );

  await driver.wait(until.elementIsEnabled(submitButton), 5000);
  await driver.executeScript("arguments[0].click();", submitButton);

  console.log("🚀 Create Task submitted");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="create-task-snackbar-alert"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  if (!snackbarText.toLowerCase().includes("task created")) {
    throw new Error("Task creation success snackbar not shown");
  }

  console.log("🎉 Task created successfully");
});

/* =======================
   EDIT CREATED TASK
======================= */
it("should edit task description and status successfully", async function () {

  //   /* =======================
//      GO TO TASKS TAB
//   ======================= */
  const tasksTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-tasks"]')),
    10000
  );
  await tasksTab.click();

  await driver.wait(
    until.elementLocated(By.id("tab-content-tasks")),
    10000
  );

  console.log("📋 Tasks tab opened");

  /* =======================
     WAIT FOR TASKS BOARD
  ======================= */
  await driver.wait(
    until.elementLocated(By.id("kanban-board")),
    10000
  );

  await driver.wait(async () => {
  const cards = await driver.findElements(
    By.css('[data-testid^="task-card-"]')
  );
  return cards.length > 0;
}, 15000);


  /* =======================
     FIND CREATED TASK CARD
     (by title text)
  ======================= */
  const taskCard = await driver.wait(
  until.elementLocated(
    By.xpath(
      "//*[starts-with(@data-testid,'task-title-') and contains(normalize-space(.),'Automation Task')]/ancestor::*[starts-with(@data-testid,'task-card-')]"
    )
  ),
  15000
);


  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    taskCard
  );
  await driver.executeScript("arguments[0].click();", taskCard);

  console.log("✏️ Task card clicked");

  /* =======================
     WAIT FOR EDIT DIALOG
  ======================= */
  const dialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="edit-task-dialog"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(dialog), 5000);
  console.log("🪟 Edit Task dialog opened");

  /* =======================
     VERIFY PREFILLED VALUES
  ======================= */
  const descriptionInput = await driver.findElement(
    By.css('[data-testid="edit-task-description-input"] textarea')
  );

  const existingDescription = await descriptionInput.getAttribute("value");
  if (!existingDescription) {
    throw new Error("Task description not prefilled");
  }

  console.log("✅ Fields are prefilled");

  /* =======================
     UPDATE DESCRIPTION
  ======================= */
  await descriptionInput.clear();
  await descriptionInput.sendKeys(
    "Updated via Selenium automation"
  );

  console.log("✍️ Description updated");

  /* =======================
     UPDATE STATUS (MUI FIX)
  ======================= */
  const statusSelect = await driver.findElement(
    By.css('[data-testid="edit-task-status-select"]')
  );

  await driver.actions()
    .move({ origin: statusSelect })
    .press()
    .release()
    .perform();

  const newStatusOption = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="edit-task-status-inprogress"]')
    ),
    10000
  );

  await newStatusOption.click();
  console.log("🔄 Status changed to In Progress");

  /* =======================
     CLICK UPDATE
  ======================= */
  const updateButton = await driver.findElement(
    By.css('[data-testid="edit-task-update-button"]')
  );

  await driver.wait(until.elementIsEnabled(updateButton), 5000);
  await driver.executeScript("arguments[0].click();", updateButton);

  console.log("🚀 Update Task clicked");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="edit-task-snackbar-alert"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  if (!snackbarText.toLowerCase().includes("updated")) {
    throw new Error("Task update success snackbar not shown");
  }

  console.log("🎉 Task updated successfully");

  /* =======================
     WAIT FOR DIALOG CLOSE
  ======================= */
  await driver.wait(until.stalenessOf(dialog), 10000);
});

/* =======================
   ADD COMMENT TO TASK
======================= */
it("should add a comment to the task successfully", async function () {

  /* =======================
     ENSURE TASKS TAB ACTIVE
  ======================= */
  const tasksTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-tasks"]')),
    10000
  );
  await tasksTab.click();

  await driver.wait(
    until.elementLocated(By.id("tab-content-tasks")),
    10000
  );

  console.log("📋 Tasks tab active");

  /* =======================
     WAIT FOR TASK CARDS
  ======================= */
  await driver.wait(async () => {
    const cards = await driver.findElements(
      By.css('[data-testid^="task-card-"]')
    );
    return cards.length > 0;
  }, 15000);

  /* =======================
     FIND CREATED TASK CARD
  ======================= */
  const taskCard = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//*[starts-with(@data-testid,'task-title-') and contains(normalize-space(.),'Automation Task')]/ancestor::*[starts-with(@data-testid,'task-card-')]"
      )
    ),
    15000
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    taskCard
  );
  await driver.executeScript("arguments[0].click();", taskCard);

  console.log("✏️ Task card clicked");

  /* =======================
     WAIT FOR EDIT TASK DIALOG
  ======================= */
  const editDialog = await driver.wait(
    until.elementLocated(By.css('[data-testid="edit-task-dialog"]')),
    10000
  );
  await driver.wait(until.elementIsVisible(editDialog), 5000);

  console.log("🪟 Edit Task dialog opened");

  /* =======================
     SCROLL TO ADD COMMENT
  ======================= */
  const addCommentBtn = await driver.findElement(
    By.css('[data-testid="edit-task-add-comment-button"]')
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    addCommentBtn
  );
  await driver.executeScript("arguments[0].click();", addCommentBtn);

  console.log("💬 Add Comment button clicked");

  /* =======================
     WAIT FOR COMMENT DIALOG
  ======================= */
  const commentDialog = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="add-task-comment-dialog"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(commentDialog), 5000);
  console.log("🪟 Add Comment dialog opened");

  /* =======================
     ENTER COMMENT
  ======================= */
  const commentInput = await driver.findElement(
    By.css('[data-testid="add-task-comment-input"] textarea')
  );

  await commentInput.sendKeys(
    "This comment was added via Selenium automation"
  );

  console.log("✍️ Comment entered");

  /* =======================
     SUBMIT COMMENT
  ======================= */
  const submitCommentBtn = await driver.findElement(
    By.css('[data-testid="add-task-comment-submit-button"]')
  );

  await driver.wait(until.elementIsEnabled(submitCommentBtn), 5000);
  await driver.executeScript("arguments[0].click();", submitCommentBtn);

  console.log("🚀 Add Comment submitted");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="add-task-comment-snackbar-alert"]')
    ),
    10000
  );

  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  if (!snackbarText.toLowerCase().includes("comment added")) {
    throw new Error("Comment success snackbar not shown");
  }

  console.log("🎉 Comment added successfully");

  /* =======================
     CLOSE EDIT TASK DIALOG
  ======================= */
  const cancelBtn = await driver.findElement(
    By.css('[data-testid="edit-task-cancel-button"]')
  );

  await driver.executeScript("arguments[0].click();", cancelBtn);
  await driver.wait(until.stalenessOf(editDialog), 10000);

  console.log("✅ Edit Task dialog closed");
});

/* =======================
   UPLOAD SCHEDULE CSV
======================= */
it("should upload schedule CSV successfully", async function () {

  /* =======================
     GO TO IMPORT TAB
  ======================= */
  const importTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-import"]')),
    10000
  );

  await importTab.click();

  await driver.wait(
    until.elementLocated(By.id("tab-content-import")),
    10000
  );

  console.log("📥 Import tab opened");

  /* =======================
     WAIT FOR FILE INPUT
  ======================= */
  const fileInput = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="csv-file-input"]')
    ),
    10000
  );

  console.log("📂 Please select a CSV file manually...");

  /* =======================
     MANUAL FILE SELECTION
  ======================= */
  // Click file input → OS file picker opens
  await driver.executeScript("arguments[0].click();", fileInput);

  // Give time to manually select the file
  await driver.sleep(15000);

  /* =======================
     CLICK UPLOAD CSV
  ======================= */
  const uploadButton = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="upload-csv-button"]')
    ),
    10000
  );

  await driver.wait(until.elementIsEnabled(uploadButton), 10000);
  await driver.executeScript("arguments[0].click();", uploadButton);

  console.log("🚀 Upload CSV button clicked");

  /* =======================
     SUCCESS SNACKBAR
  ======================= */
  const snackbar = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="import-snackbar-alert"]')
    ),
    15000
  );

  await driver.wait(until.elementIsVisible(snackbar), 5000);

  const snackbarText = await snackbar.getText();
  if (!snackbarText.toLowerCase().includes("uploaded")) {
    throw new Error("CSV upload success snackbar not shown");
  }

  console.log("🎉 CSV uploaded successfully");

  /* =======================
     OPTIONAL: VERIFY JOB ID
  ======================= */
  const jobId = await driver.wait(
    until.elementLocated(
      By.css('[data-testid="job-id"]')
    ),
    10000
  );

  const jobIdText = await jobId.getText();
  if (!jobIdText) {
    throw new Error("Job ID not displayed after upload");
  }

  console.log(`🆔 Import Job ID: ${jobIdText}`);

    /* =======================
     GO BACK TO SCHEDULES TAB
  ======================= */
  const schedulesTab = await driver.wait(
    until.elementLocated(By.css('[data-testid="tab-schedules"]')),
    10000
  );

  await schedulesTab.click();

  await driver.wait(
    until.elementLocated(By.id("tab-content-schedules")),
    10000
  );

  console.log("📅 Navigated back to Schedules tab");

  /* =======================
     WAIT 5 SECONDS
  ======================= */
  await driver.sleep(5000);
  console.log("⏳ Waited 5 seconds on Schedules tab");

});


after(async function () {
    if (driver) {
      console.log("🚀 Closing browser...");
      await driver.quit(); // closes all tabs and ends session
  }
  });
});
