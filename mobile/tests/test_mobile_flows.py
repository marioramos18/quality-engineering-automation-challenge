from uuid import uuid4

from mobile.pages.data_management_page import DataManagementPage
from mobile.pages.login_page import LoginPage
from mobile.pages.navigation import Navigation


def test_simulated_login_and_navigation(driver) -> None:
    navigation = Navigation(driver)
    navigation.open_login()
    login = LoginPage(driver)
    login.sign_in("mobile.qa@example.com", "synthetic-pass-123")
    login.assert_simulated_success()
    navigation.open_forms()


def test_persisted_value_is_recovered_after_restart(driver) -> None:
    navigation = Navigation(driver)
    navigation.open_data_management()
    data = DataManagementPage(driver)
    value = f"mobile-qa-{uuid4().hex}"
    data.save_persisted_value(value)
    data.assert_persisted_value(value)

    driver.terminate_app("com.wdiodemoapp")
    driver.activate_app("com.wdiodemoapp")
    navigation.open_data_management()
    data.assert_persisted_value(value)
