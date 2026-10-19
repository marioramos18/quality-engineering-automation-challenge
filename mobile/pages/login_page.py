from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class LoginPage:
    def __init__(self, driver) -> None:
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)

    def sign_in(self, email: str, password: str) -> None:
        self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "input-email")
            )
        ).send_keys(email)
        self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "input-password")
            )
        ).send_keys(password)
        self.wait.until(
            EC.element_to_be_clickable(
                (AppiumBy.ANDROID_UIAUTOMATOR, 'new UiSelector().text("LOGIN")')
            )
        ).click()

    def assert_simulated_success(self) -> None:
        alert = self.wait.until(EC.alert_is_present())
        assert "You are logged in!" in alert.text
        alert.accept()
        if self.driver.is_keyboard_shown():
            self.driver.hide_keyboard()
