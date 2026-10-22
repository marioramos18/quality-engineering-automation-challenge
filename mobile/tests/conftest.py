import os
import re
from pathlib import Path
from uuid import uuid4
from xml.etree import ElementTree

import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait


def _capture_evidence(session, name: str) -> None:
    evidence_dir = Path("reports/mobile")
    evidence_dir.mkdir(parents=True, exist_ok=True)
    prefix = evidence_dir / f"{name}-{uuid4().hex[:8]}"
    try:
        session.save_screenshot(str(prefix) + ".png")
    except WebDriverException as error:
        print(f"Could not capture screenshot for {name}: {error}")
    try:
        Path(str(prefix) + ".xml").write_text(session.page_source)
    except (OSError, WebDriverException) as error:
        print(f"Could not capture hierarchy for {name}: {error}")


def _wait_for_home(session) -> None:
    anr_handled = False

    def home_ready(driver) -> bool:
        nonlocal anr_handled
        nodes = list(ElementTree.fromstring(driver.page_source).iter("node"))
        launcher_anr = any(
            node.get("resource-id") == "android:id/alertTitle"
            and node.get("text") == "Pixel Launcher isn't responding"
            for node in nodes
        )
        if launcher_anr:
            _capture_evidence(driver, "launcher-anr-appium")
            if anr_handled:
                raise RuntimeError("Pixel Launcher ANR persisted after selecting Wait")
            anr_handled = True
            driver.find_element(AppiumBy.ID, "android:id/aerr_wait").click()
            return False
        return any(node.get("content-desc") == "Home-screen" for node in nodes)

    WebDriverWait(session, 30, poll_frequency=1).until(
        home_ready,
        message="The app home screen did not appear before the mobile test",
    )


@pytest.fixture
def driver():
    options = UiAutomator2Options()
    options.set_capability("platformName", "Android")
    options.set_capability("appium:deviceName", "Android Emulator")
    options.set_capability("appium:udid", os.getenv("MOBILE_UDID", "emulator-5554"))
    options.set_capability("appium:appPackage", "com.wdiodemoapp")
    options.set_capability("appium:appActivity", ".MainActivity")
    options.set_capability("appium:noReset", False)
    session = webdriver.Remote(
        os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723"),
        options=options,
    )
    try:
        try:
            _wait_for_home(session)
        except Exception:
            _capture_evidence(session, "appium-home-unavailable")
            raise
        yield session
    finally:
        session.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if not report.failed or report.when not in {"setup", "call"}:
        return
    session = item.funcargs.get("driver")
    if session is None:
        return

    name = re.sub(r"[^a-zA-Z0-9_-]+", "-", item.nodeid)[:80]
    _capture_evidence(session, name)
