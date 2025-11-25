const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000"; // login page URL

describe("Admin Dashboard & Room Booking Tabs Test", function () {
  this.timeout(180000); // 3 minutes to allow manual login and page loads

  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();

    // Step 1: Go to Login page
    await driver.get(BASE_URL);

    // Step 2: Click "Sign in with Cognito"
    const loginButton = await driver.findElement(By.css("button"));
    await loginButton.click();

    console.log("Please manually enter your Cognito credentials in the browser...");

    // Step 3: Wait for dashboard to load
    const dashboardTitle = await driver.wait(
      until.elementLocated(By.id("dashboard-title")),
      60000
    );
    const titleText = await dashboardTitle.getText();
    assert.strictEqual(titleText, "Admin Portal");
    console.log("Login successful, dashboard loaded!");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("should display Room & Resource Booking side panel option", async function () {
    const roomTabButton = await driver.findElement(By.id("nav-roomBooking"));
    assert.ok(await roomTabButton.isDisplayed(), "Room & Resource Booking option is visible in sidebar");
  });

  it("should load Add Rooms & Reservations tab correctly", async function () {
    const roomTabButton = await driver.findElement(By.id("nav-roomBooking"));
    await roomTabButton.click();

    const tabRoomBooking = await driver.findElement(By.id("tab-room-booking"));
    const tabTitle = await driver.wait(
      until.elementLocated(By.id("room-booking-title")),
      5000
    );
    assert.strictEqual(await tabTitle.getText(), "Room & Resource Booking");

    const container = await driver.findElement(By.id("rooms-list-container"));
    assert.ok(await container.isDisplayed(), "Rooms list container is visible");

    const roomCard = await driver.findElement(By.css("#rooms-list-container div")); // at least one child card
    assert.ok(await roomCard.isDisplayed(), "At least one room card is visible");

    const fabButton = await driver.findElement(By.id("room-add-floating-button"));
    assert.ok(await fabButton.isDisplayed(), "Floating Add button is visible");
    console.log("Add Rooms & Reservations tab loaded successfully.");
  });

  it("should load All Reservations tab correctly", async function () {
    const tabReservations = await driver.findElement(By.id("tab-room-reservations"));
    await tabReservations.click();

    const bookingsList = await driver.wait(
      until.elementLocated(By.id("bookings-list")),
      5000
    );
    assert.ok(await bookingsList.isDisplayed(), "Bookings list is visible in All Reservations tab");
    console.log("All Reservations tab loaded successfully.");
  });

  it("should load My Bookings tab correctly", async function () {
    const tabMyBookings = await driver.findElement(By.id("tab-my-bookings"));
    await tabMyBookings.click();

    const bookingCard = await driver.wait(
      until.elementLocated(By.css("[id^='booking-card-']")),
      5000
    );
    assert.ok(await bookingCard.isDisplayed(), "At least one booking card is visible in My Bookings tab");
    console.log("My Bookings tab loaded successfully.");
  });

  it("should load Rooms KPI tab correctly", async function () {
    const tabKPI = await driver.findElement(By.id("tab-kpi"));
    await tabKPI.click();

    const fetchButton = await driver.wait(
      until.elementLocated(By.id("utilization-fetch-btn")),
      5000
    );
    assert.ok(await fetchButton.isDisplayed(), "Fetch Report button is visible in KPI tab");
    console.log("Rooms KPI tab loaded successfully.");
  });
});
