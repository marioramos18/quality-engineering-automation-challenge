@isolated-checkout
Feature: Complete checkout in an isolated environment
  As a shopper
  I want to pay with synthetic demonstration data
  So that my order is created only after valid payment details

  Background:
    Given the isolated order count is recorded
    And I have added an available product to my cart
    When I continue checkout as a guest
    And I provide a complete billing address
    And I open the payment step

  Scenario: Complete a purchase with a synthetic card accepted by the demo
    When I provide a synthetic card with valid format
    And I check the demonstration payment
    And I confirm my order
    Then my order should be confirmed and persisted with the selected product

  Scenario: Invalid card number prevents purchase
    When I provide a synthetic card with invalid format
    Then the invalid card format should prevent payment and order creation
