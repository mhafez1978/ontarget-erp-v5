"use client";

import { CreditCard, Lock, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  initialCardHolder?: string;
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
  initialCardHolder = "",
  onCardDataChange,
  onValidationChange,
  onPaymentMethodCreated,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardHolder, setCardHolder] = useState(initialCardHolder);
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

  // We only use Stripe Elements as the single source of truth. For card preview
  // we send masked values back to the parent (no PAN exposure).
  const MASKED_NUMBER = "•••• •••• •••• ••••";
  const [displayNumber, setDisplayNumber] = useState("");
  const [displayExpiry, setDisplayExpiry] = useState("");
  const [displayCvv, setDisplayCvv] = useState("");

  // Update cardHolder when initialCardHolder changes
  useEffect(() => {
    if (initialCardHolder && initialCardHolder !== cardHolder) {
      setCardHolder(initialCardHolder);
    }
  }, [initialCardHolder]);

  // Handle card holder name change
  const handleCardHolderChange = (value: string) => {
    const capitalized = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    setCardHolder(capitalized);

    // Update parent component with masked data
    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: displayNumber || (cardComplete ? MASKED_NUMBER : ""),
        cardHolder: capitalized,
        expiryDate: displayExpiry,
        cvv: displayCvv,
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
    }

    if (event.error) {
      setErrors((prev) => ({ ...prev, cardNumber: event.error?.message }));
    } else {
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    }

    // Update display and parent with masked presence (we can't read PAN)
    const display = event.empty ? "" : MASKED_NUMBER;
    setDisplayNumber(display);
    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: display,
        cardHolder,
        expiryDate: displayExpiry,
        cvv: displayCvv,
        cardBrand: nextBrand,
      });
    }
  };

  const handleExpiryChange = (event: StripeCardExpiryElementChangeEvent) => {
    setExpiryComplete(event.complete);
    if (event.error) {
      setErrors((prev) => ({ ...prev, expiry: event.error?.message }));
    } else {
      setErrors((prev) => ({ ...prev, expiry: undefined }));
    }

    // We can't access month/year from this event in all Stripe SDK versions,
    // so show a generic MM/YY placeholder when the expiry is complete.
    const expiryDisplay = event.complete ? "MM/YY" : "";
    setDisplayExpiry(expiryDisplay);

    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: displayNumber || (cardComplete ? MASKED_NUMBER : ""),
        cardHolder,
        expiryDate: expiryDisplay,
        cvv: displayCvv,
        cardBrand,
      });
    }
  };

  const handleCvcChange = (event: StripeCardCvcElementChangeEvent) => {
    setCvcComplete(event.complete);
    if (event.error) {
      setErrors((prev) => ({ ...prev, cvc: event.error?.message }));
    } else {
      setErrors((prev) => ({ ...prev, cvc: undefined }));
    }

    const cvvDisplay = event.empty ? "" : "•••";
    setDisplayCvv(cvvDisplay);

    if (onCardDataChange) {
      onCardDataChange({
        cardNumber: displayNumber || (cardComplete ? MASKED_NUMBER : ""),
        cardHolder,
        expiryDate: displayExpiry,
        cvv: cvvDisplay,
        cardBrand,
      });
    }
  };

  // Create payment method when form is valid
  useEffect(() => {
    const createPaymentMethod = async () => {
      if (!stripe || !elements || !isFormValid) {
        console.log("[PaymentForm] Skipping payment method creation:", {
          stripe: !!stripe,
          elements: !!elements,
          isFormValid,
        });
        return;
      }
      if (onPaymentMethodCreated) {
        try {
          const cardElement = elements.getElement(CardNumberElement);
          if (!cardElement) {
            console.log("[PaymentForm] Card element not found");
            return;
          }

          console.log("[PaymentForm] Creating payment method...");
          const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
            billing_details: {
              name: cardHolder,
            },
          });

          if (error) {
            console.error(
              "[PaymentForm] Payment method creation error:",
              error
            );
          } else if (paymentMethod) {
            console.log(
              "[PaymentForm] Payment method created successfully:",
              paymentMethod.id
            );
            onPaymentMethodCreated(paymentMethod.id, {
              brand: paymentMethod.card?.brand,
              last4: paymentMethod.card?.last4,
            });
          }
        } catch (error) {
          console.error("[PaymentForm] Payment method creation failed:", error);
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

      {/* Card Number - Stripe Secure Element */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Card Number
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
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          All card fields below are secure and processed by Stripe. We never
          store full card numbers.
        </p>
      </div>

      {/* Expiry and CVV - Stripe Secure Elements */}
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
            For your security, full card numbers are never exposed to the app.
            We display a masked preview and the card ending in the last 4 digits
            after the card is saved.
          </p>
        </div>
      </div>
    </div>
  );
}
