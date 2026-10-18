@account-navigation
Feature: Account navigation
  Scenario: Customer opens their profile from the account page
    Given I am on the Toolshop login page
    When I sign in with valid customer credentials
    Then I should see my account page
    When I open my account profile
    Then the account profile form should be visible
