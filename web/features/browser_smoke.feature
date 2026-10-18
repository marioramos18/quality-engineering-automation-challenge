@smoke
Feature: Browser infrastructure

  Scenario: Chromium renders a page successfully
    Given I open a simple test page
    Then the page heading should be "Browser ready"
