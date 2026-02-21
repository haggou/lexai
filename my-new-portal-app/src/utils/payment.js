/**
 * Utility to handle Razorpay Payments
 */

// Load Razorpay SDK Script
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Initiate a Razorpay Payment
 * @param {Object} options Payment options
 * @param {String} options.amount Amount in INR (will be converted to paise)
 * @param {String} options.name Name of the service/product
 * @param {String} options.description Description of the payment
 * @param {Function} options.onSuccess Callback on successful payment
 * @param {Function} options.onFailure Callback on failure (optional)
 * @param {Object} options.prefill Prefill data { name, email, contact }
 */
export const initiatePayment = async ({
    amount,
    currency = "INR",
    name = "LexAI Portal",
    description,
    orderId, // Optional, usually provided by backend
    onSuccess,
    onFailure,
    prefill = {}
}) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
        alert("Razorpay SDK failed to load. Check your internet connection.");
        if (onFailure) onFailure(new Error("SDK Load Failed"));
        return;
    }

    // Default to Test Key if not in env
    const key = process.env.REACT_APP_RAZORPAY_KEY_ID;

    if (!key || key === 'rzp_test_PLACEHOLDER_KEY') {
        console.warn("Using placeholder Razorpay Key. Payments may not initiate correctly in production mode.");
    }

    const options = {
        key: key,
        amount: amount / 100, // Razorpay takes amount in paise
        currency: currency,
        name: name,
        description: description,
        image: "https://cdn-icons-png.flaticon.com/512/2855/2855243.png", // Generic Logo
        order_id: orderId, // If backend generated an order ID
        handler: async function (response) {
            if (onSuccess) onSuccess(response);
        },
        prefill: {
            name: prefill.name || "User",
            email: prefill.email || "user@example.com",
            contact: prefill.contact || ""
        },
        theme: {
            color: "#3b82f6"
        },
        modal: {
            ondismiss: function () {
                if (onFailure) onFailure(new Error("Payment Cancelled"));
            }
        }
    };

    try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
            console.error(response.error);
            if (onFailure) onFailure(response.error);
        });
        rzp.open();
    } catch (err) {
        console.error("Razorpay Error:", err);
        if (onFailure) onFailure(err);
    }
};
