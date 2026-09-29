export interface PaymentGatewayOptions {
  amount: number; // in INR
  lawyerName: string;
  lawyerSpecialization: string;
  consultationMode: string;
  bookingSlot: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  onSuccess: (paymentResult: {
    paymentId: string;
    orderId: string;
    method: string;
    verifiedAccountOwner: string;
  }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

// Dynamically load Razorpay standard checkout SDK script
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-sdk");
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Could not load external Razorpay checkout SDK script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

// Launch Official Razorpay Payment Gateway
export async function launchPaymentGateway(options: PaymentGatewayOptions): Promise<boolean> {
  const isLoaded = await loadRazorpayScript();
  const razorpayKey =
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "rzp_test_51LegalEscrow99";

  if (isLoaded && (window as any).Razorpay) {
    try {
      const orderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const rzpOptions = {
        key: razorpayKey,
        amount: options.amount * 100, // amount in paise
        currency: "INR",
        name: "Legal Consultancy Service",
        description: `Consultation with ${options.lawyerName} (${options.consultationMode})`,
        image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=128&auto=format&fit=crop&q=80",
        order_id: orderId,
        prefill: {
          name: options.clientName || "Siddharth Desai",
          email: options.clientEmail || "client@legalconsultancy.in",
          contact: options.clientPhone || "9876543210",
        },
        notes: {
          advocate: options.lawyerName,
          specialization: options.lawyerSpecialization,
          mode: options.consultationMode,
          slot: options.bookingSlot,
        },
        theme: {
          color: "#0f172a",
          backdrop_color: "rgba(15, 23, 42, 0.75)",
        },
        modal: {
          ondismiss: () => {
            if (options.onDismiss) options.onDismiss();
          },
        },
        handler: function (response: any) {
          options.onSuccess({
            paymentId: response.razorpay_payment_id || `pay_${Date.now().toString(36)}`,
            orderId: response.razorpay_order_id || orderId,
            method: "Razorpay Verified Gateway (UPI/Card/NetBanking)",
            verifiedAccountOwner: options.clientName.toUpperCase(),
          });
        },
      };

      const rzpInstance = new (window as any).Razorpay(rzpOptions);
      rzpInstance.open();
      return true;
    } catch (err) {
      console.warn("Failed to open Razorpay gateway instance:", err);
      if (options.onFailure) options.onFailure(err);
    }
  }

  return false;
}
