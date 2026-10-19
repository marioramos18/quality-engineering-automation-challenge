from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class DataManagementPage:
    def __init__(self, driver) -> None:
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)

    def _scroll_to(self, accessibility_id: str) -> None:
        locator = (
            "new UiScrollable(new UiSelector().scrollable(true))"
            f'.scrollIntoView(new UiSelector().description("{accessibility_id}"))'
        )
        self.wait.until(
            lambda driver: driver.find_element(AppiumBy.ANDROID_UIAUTOMATOR, locator)
        )

    def save_persisted_value(self, value: str) -> None:
        self._scroll_to("data-async-input")
        field = self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "data-async-input")
            )
        )
        field.clear()
        field.send_keys(value)
        self.wait.until(
            lambda driver: driver.find_element(
                AppiumBy.ACCESSIBILITY_ID, "data-async-input"
            ).text == value,
            message="Persisted input did not contain the entered value",
        )
        if self.driver.is_keyboard_shown():
            self.driver.hide_keyboard()

        # The first exact "Save" belongs to the persisted key-value section;
        # the preceding in-memory button is labeled "Save (memory)".
        self.wait.until(
            lambda driver: driver.find_element(
                AppiumBy.ANDROID_UIAUTOMATOR,
                'new UiScrollable(new UiSelector().scrollable(true))'
                '.scrollIntoView(new UiSelector().text("Save"))',
            )
        )
        self.wait.until(
            EC.element_to_be_clickable(
                (AppiumBy.ANDROID_UIAUTOMATOR, 'new UiSelector().text("Save").instance(0)')
            )
        ).click()

    def assert_persisted_value(self, expected: str) -> None:
        self._scroll_to("data-async-readout")
        self.wait.until(
            lambda driver: driver.find_element(
                AppiumBy.ACCESSIBILITY_ID, "data-async-readout"
            ).text == expected,
            message=f"Persisted readout did not match {expected!r}",
        )
