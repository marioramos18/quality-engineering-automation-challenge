@authentication
Feature: Customer authentication
  As a registered customer
  I want to sign in to my account
  So that I can access my personal information

  @smoke @login
  Scenario: Login with valid customer credentials
    Given I am on the Toolshop login page
    When I sign in with valid customer credentials
    Then I should see my account page

  @login-negative
  Scenario Outline: Reject invalid customer credentials
    Given I am on the Toolshop login page
    When I sign in with email "<email>" and password "<password>"
    Then authentication should be rejected

    Examples:
      | email                                | password          |
      | customer@practicesoftwaretesting.com | IncorrectPass123! |
      | nonexistent.qa@example.com           | welcome01         |

  @login-validation
  Scenario Outline: Validate required login fields
    Given I am on the Toolshop login page
    When I sign in with email "<email>" and password "<password>"
    Then the "<field>" field should display a required validation message

    Examples:
      | email                                | password  | field    |
      |                                      | welcome01 | email    |
      | customer@practicesoftwaretesting.com |           | password |

  @login-validation
  Scenario: Validate both required fields are empty
    Given I am on the Toolshop login page
    When I sign in with email "" and password ""
    Then the "email" field should display a required validation message
    And the "password" field should display a required validation message
