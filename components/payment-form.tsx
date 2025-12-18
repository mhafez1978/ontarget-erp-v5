"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Calendar, Lock, User } from "lucide-react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import type {
  StripeCardNumberElementChangeEvent,
  StripeCardExpiryElementChangeEvent,
  StripeCardCvcElementChangeEvent,
} from "@stripe/stripe-js";

interface PaymentFormProps {
  onCardDataChange?: (cardData: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
    cardBrand: "visa" | "mastercard" | "amex" | "discover";
  }) => void;
  onValidationChange?: (isValid: boolean) => void;
  onPaymentMethodCreated?: (
    paymentMethodId: string,
    details?: { brand?: string; last4?: string }
  ) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1a1a1a",
      "::placeholder": {
        color: "#94a3b8",
      },
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};

export function PaymentForm({
  onCardDataChange,
  onValidationChange,
  onPaymentMethodCreated,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardHolder, setCardHolder] = useState("");
  const [cardBrand, setCardBrand] = useState<
    "visa" | "mastercard" | "amex" | "discover"
  >("visa");
  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cvc?: string;
  }>({});

  // Check if form is complete
  const isFormValid =
    cardHolder.length > 0 && cardComplete && expiryComplete && cvcComplete;

  // Notify parent of validation state
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid);
    }
  }, [isFormValid, onValidationChange]);

  // State to track card details for display (visual input)
  const [visualCardNumber, setVisualCardNumber] = useState("");
  const [visualExpiry, setVisualExpiry] = useState("");
  const [visualCvv, setVisualCvv] = useState("");

  // Handle card holder name change
  const handleCardHolderChange = (value: string) => {
    const capitalized = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    setCardHolder(capitalized);

    // Update parent component with visual card data
    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: visualCardNumber,
        cardHolder: capitalized,
        expiryDate: visualExpiry,
        cvv: visualCvv,
        cardBrand,
      });
    }
  };

  // Handle visual card number input (for display only)
  const handleVisualCardNumberChange = (value: string) => {
    // Remove non-digit characters
    const digitsOnly = value.replace(/\D/g, "");
    // Limit to 16 digits
    const limited = digitsOnly.slice(0, 16);
    setVisualCardNumber(limited);

    // Update parent component
    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: limited,
        cardHolder,
        expiryDate: visualExpiry,
        cvv: visualCvv,
        cardBrand,
      });
    }
  };

  // Handle visual expiry input (for display only)
  const handleVisualExpiryChange = (value: string) => {
    // Remove non-digit characters
    const digitsOnly = value.replace(/\D/g, "");
    // Format as MM/YY
    let formatted = digitsOnly;
    if (digitsOnly.length >= 2) {
      formatted = digitsOnly.slice(0, 2) + "/" + digitsOnly.slice(2, 4);
    }
    setVisualExpiry(formatted);

    // Update parent component
    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: visualCardNumber,
        cardHolder,
        expiryDate: formatted,
        cvv: visualCvv,
        cardBrand,
      });
    }
  };

  // Handle visual CVV input (for display only)
  const handleVisualCvvChange = (value: string) => {
    // Remove non-digit characters
    const digitsOnly = value.replace(/\D/g, "");
    // Limit to 4 digits
    const limited = digitsOnly.slice(0, 4);
    setVisualCvv(limited);

    // Update parent component
    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: visualCardNumber,
        cardHolder,
        expiryDate: visualExpiry,
        cvv: limited,
        cardBrand,
      });
    }
  };

  // Handle card element changes (Stripe secure element)
  const handleCardNumberChange = (
    event: StripeCardNumberElementChangeEvent
  ) => {
    setCardComplete(event.complete);
    let nextBrand = cardBrand;

    if (event.brand) {
      const brandMap: Record<
        string,
        "visa" | "mastercard" | "amex" | "discover"
      > = {
        visa: "visa",
        mastercard: "mastercard",
        amex: "amex",
        discover: "discover",
      };
      nextBrand = brandMap[event.brand] || "visa";
      setCardBrand(nextBrand);

      // Update parent with brand change
      if (onCardDataChange) {
        onCardDataChange({
          cardNumber: visualCardNumber,
          cardHolder,
          expiryDate: visualExpiry,
          cvv: visualCvv,
          cardBrand: nextBrand,
        });
      }
    }

    if (event.error) {
      setErrors((prev) => ({ ...prev, cardNumber: event.error?.message }));
    } else {
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleExpiryChange = (event: StripeCardExpiryElementChangeEvent) => {
    setExpiryComplete(event.complete);
    if (event.error) {
      setErrors((prev) => ({ ...prev, expiry: event.error?.message }));
    } else {
      setErrors((prev) => ({ ...prev, expiry: undefined }));
    }
  };

  const handleCvcChange = (event: StripeCardCvcElementChangeEvent) => {
    setCvcComplete(event.complete);
    if (event.error) {
      setErrors((prev) => ({ ...prev, cvc: event.error?.message }));
    } else {
      setErrors((prev) => ({ ...prev, cvc: undefined }));
    }
  };

  // Create payment method when form is valid
  useEffect(() => {
    const createPaymentMethod = async () => {
      if (!stripe || !elements || !isFormValid) return;
      if (onPaymentMethodCreated) {
        try {
          const cardElement = elements.getElement(CardNumberElement);
          if (!cardElement) return;

          const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
            billing_details: {
              name: cardHolder,
            },
          });

          if (error) {
            console.error("Payment method creation error:", error);
          } else if (paymentMethod) {
            onPaymentMethodCreated(paymentMethod.id, {
              brand: paymentMethod.card?.brand,
              last4: paymentMethod.card?.last4,
            });
          }
        } catch (error) {
          console.error("Payment method creation failed:", error);
        }
      }
    };

    // Debounce payment method creation
    const timeoutId = setTimeout(createPaymentMethod, 1000);
    return () => clearTimeout(timeoutId);
  }, [stripe, elements, isFormValid, cardHolder, onPaymentMethodCreated]);

  return (
    <div className="space-y-4">
      {/* Card Holder Name */}
      <div className="space-y-2">
        <Label htmlFor="cardHolder" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Card Holder Name
        </Label>
        <Input
          id="cardHolder"
          type="text"
          placeholder="John Doe"
          value={cardHolder}
          onChange={(e) => handleCardHolderChange(e.target.value)}
          className={errors.cardHolder ? "border-red-500" : ""}
        />
        {errors.cardHolder && (
          <p className="text-xs text-red-500">{errors.cardHolder}</p>
        )}
      </div>

      {/* Card Number - Visual Input */}
      <div className="space-y-2">
        <Label htmlFor="visualCardNumber" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Card Number
        </Label>
        <Input
          id="visualCardNumber"
          type="text"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={visualCardNumber.replace(/(\d{4})/g, "$1 ").trim()}
          onChange={(e) => handleVisualCardNumberChange(e.target.value)}
          maxLength={19}
        />
        <p className="text-xs text-muted-foreground">
          Enter your card number above for preview
        </p>
      </div>

      {/* Card Number - Stripe Secure Element (hidden but functional) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground text-xs">
          <Lock className="h-3 w-3" />
          Secure Card Verification
        </Label>
        <div className="p-3 border rounded-md bg-background">
          <CardNumberElement
            options={cardElementOptions}
            onChange={handleCardNumberChange}
          />
        </div>
        {errors.cardNumber && (
          <p className="text-xs text-red-500">{errors.cardNumber}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Re-enter your card number here for secure payment processing
        </p>
      </div>

      {/* Expiry and CVC - Visual Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="visualExpiry" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Expiry Date
          </Label>
          <Input
            id="visualExpiry"
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={visualExpiry}
            onChange={(e) => handleVisualExpiryChange(e.target.value)}
            maxLength={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visualCvv" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            CVV
          </Label>
          <Input
            id="visualCvv"
            type="text"
            inputMode="numeric"
            placeholder="123"
            value={visualCvv}
            onChange={(e) => handleVisualCvvChange(e.target.value)}
            maxLength={4}
          />
        </div>
      </div>

      {/* Expiry and CVC - Stripe Secure Elements */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground text-xs">
            <Lock className="h-3 w-3" />
            Secure Expiry
          </Label>
          <div className="p-3 border rounded-md bg-background">
            <CardExpiryElement
              options={cardElementOptions}
              onChange={handleExpiryChange}
            />
          </div>
          {errors.expiry && (
            <p className="text-xs text-red-500">{errors.expiry}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground text-xs">
            <Lock className="h-3 w-3" />
            Secure CVV
          </Label>
          <div className="p-3 border rounded-md bg-background">
            <CardCvcElement
              options={cardElementOptions}
              onChange={handleCvcChange}
            />
          </div>
          {errors.cvc && <p className="text-xs text-red-500">{errors.cvc}</p>}
        </div>
      </div>

      {/* Security Message */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
        <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Your payment information is secure</p>
          <p className="mt-1">
            Enter your card details twice: once for the visual preview card, and
            again in the secure fields for payment processing. We use Stripe for
            secure payment processing.
          </p>
        </div>
      </div>
    </div>
  );
}
