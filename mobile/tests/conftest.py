import os
import re
from pathlib import Path
from uuid import uuid4

import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options
from selenium.common.exceptions import WebDriverException


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

    evidence_dir = Path("reports/mobile")
    evidence_dir.mkdir(parents=True, exist_ok=True)
    name = re.sub(r"[^a-zA-Z0-9_-]+", "-", item.nodeid)[:80]
    prefix = evidence_dir / f"{name}-{uuid4().hex[:8]}"
    try:
        session.save_screenshot(str(prefix) + ".png")
    except WebDriverException as error:
        print(f"Could not capture screenshot for {item.nodeid}: {error}")
    try:
        Path(str(prefix) + ".xml").write_text(session.page_source)
    except (OSError, WebDriverException) as error:
        print(f"Could not capture hierarchy for {item.nodeid}: {error}")
