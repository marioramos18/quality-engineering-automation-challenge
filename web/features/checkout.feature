@checkout-safe
Feature: Shopping cart and guest checkout
  As a shopper
  I want to review my cart and reach payment as a guest
  So that I can verify the checkout flow before placing an order

  Scenario: Available product has a consistent cart total
    Given I have added an available product to my cart
    When I view my cart
    Then the cart should show the product with a consistent quantity and total

  Scenario: Guest reaches payment with a complete billing address
    Given I have added an available product to my cart
    When I continue checkout as a guest
    And I provide a complete billing address
    Then I should reach the payment step without placing an order

  Scenario Outline: Incomplete billing address prevents checkout
    Given I have added an available product to my cart
    When I continue checkout as a guest
    And I provide a billing address without "<field>"
    Then I should remain on billing address without being able to continue

    Examples:
      | field        |
      | postal_code  |
      | house_number |
      | street       |
      | city         |
      | state        |
