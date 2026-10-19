from pathlib import Path
from uuid import uuid4

from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class Navigation:
    def __init__(self, driver) -> None:
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)

    def _record_hierarchy(self, screen: str) -> None:
        directory = Path("reports/mobile")
        directory.mkdir(parents=True, exist_ok=True)
        (directory / f"{screen}-{uuid4().hex[:8]}.xml").write_text(
            self.driver.page_source
        )

    def open_login(self) -> None:
        self.wait.until(
            EC.element_to_be_clickable((AppiumBy.ACCESSIBILITY_ID, "Login"))
        ).click()
        self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "Login-screen")
            )
        )
        self._record_hierarchy("login")

    def open_forms(self) -> None:
        self.wait.until(
            EC.element_to_be_clickable((AppiumBy.ACCESSIBILITY_ID, "Forms"))
        ).click()
        self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "Forms-screen")
            )
        )
        self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "text-input")
            )
        )
        self._record_hierarchy("forms")

    def open_data_management(self) -> None:
        self.wait.until(
            EC.element_to_be_clickable((AppiumBy.ACCESSIBILITY_ID, "Menu"))
        ).click()
        self.wait.until(
            EC.element_to_be_clickable(
                (AppiumBy.ACCESSIBILITY_ID, "side-menu-item-data-management")
            )
        ).click()
        self.wait.until(
            EC.visibility_of_element_located(
                (AppiumBy.ACCESSIBILITY_ID, "DataManagement-screen")
            )
        )
        self._record_hierarchy("data-management")
