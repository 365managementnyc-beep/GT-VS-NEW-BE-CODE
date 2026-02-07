const crypto = require("crypto");
const catchAsync = require("./catchAsync");

const { API_TOKEN } = process.env;
const { API_SECRET } = process.env;
const API_URL = process.env.API_URL || "https://api.veriff.me/v1";
const KYCDocumentSchema = require("../models/KYCDocument");

const { fetch } = require('cross-fetch');
const sendNotification = require("./storeNotification");

const fetchImageAsBase64 = async (url) => {
    console.log("url", url);
    if (!url) return null; // Handle null or undefined URL
    const res = await fetch(url);
    const buffer = await res.arrayBuffer(); // Get as ArrayBuffer
    return Buffer.from(buffer).toString("base64"); // Convert to base64
};

const uploadVeriff = async (data) => {
    try {

        console.log("data", data);
        const frontBase64 = await fetchImageAsBase64(data.frontImage);
        const backBase64 = await fetchImageAsBase64(data.backImage);
        const selfieBase64 = await fetchImageAsBase64(data.selfieImage);

        // Step 1: Start Veriff session
        const session = await startVerificationSession(data);
        console.log("session................", session);

        const verificationId = session?.verification?.id;

        // Step 2: Upload images
        const makeImagePayload = (base64Content, context) => {
            const payloadObj = {
                image: {
                    context,
                    content: base64Content,
                    timestamp: timestamp()
                }
            };
            const payloadStr = JSON.stringify(payloadObj);
            const headers = {
                "x-auth-client": API_TOKEN,
                "x-hmac-signature": generateSignature(payloadStr, API_SECRET),
                "content-type": "application/json"
            };
            return { payloadStr, headers };
        };

        // Document front
        const front = makeImagePayload(frontBase64, "document-front");
        await fetch(`${API_URL}/sessions/${verificationId}/media`, {
            method: "POST",
            headers: front.headers,
            body: front.payloadStr
        });

        // Document back
        const back = makeImagePayload(backBase64, "document-back");
        await fetch(`${API_URL}/sessions/${verificationId}/media`, {
            method: "POST",
            headers: back.headers,
            body: back.payloadStr
        });

        // Selfie (optional but recommended)
        const selfie = makeImagePayload(selfieBase64, "face");
        await fetch(`${API_URL}/sessions/${verificationId}/media`, {
            method: "POST",
            headers: selfie.headers,
            body: selfie.payloadStr
        });

        // Step 3: Submit verification
        const response = await endVerification(verificationId);
        console.log("this is response", response);

        return response;
    } catch (error) {

        console.error("Error in Veriff upload:", error);
        return error;
    }
};


function isSignatureValid({ signature, secret, payload }) {
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    const digest = generateSignature(payloadStr, secret);
    return digest === signature.toLowerCase();
}
function generateSignature(payload, secret) {
    if (payload.constructor !== Buffer) {
        payload = Buffer.from(payload, "utf8");
    }
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return hmac.digest("hex");
}

const VerficationComplete = catchAsync(
    async (req, res) => {
        const signature = req.get("x-hmac-signature");
        const payload = req.body;

        const isValid = isSignatureValid({
            signature,
            secret: API_SECRET,
            payload
        });

        console.log("🔔 Webhook received:", {
            isValid,
            payload
        });
        const  verification= payload?.data?.verification;

    console.log("verification", verification);

        const status = payload?.data?.verification?.decision;

        switch (status) {
            case "declined": // Declined
                if (status === "declined") {
                    await KYCDocumentSchema.findOneAndUpdate(
                        { userId: payload?.vendorData },
                        {
                            $set: {
                                status:status
                            }
                        },
                        { new: true }
                    )

                }


            case "resubmission_requested": // Resubmission requested
                if (status === "resubmission_requested") {
                    console.log("resubmission_requested", status);
                    await KYCDocumentSchema.findOneAndUpdate(
                        { userId: payload?.vendorData },
                        {
                            $set: {
                                status: "inprogress"
                            }
                        },
                        { new: true }
                    )

                }


            case "expired":
                if (status === "expired") {
                    console.log("expired", status);
                    await KYCDocumentSchema.findOneAndUpdate(
                        { userId: payload?.vendorData },
                        {
                            $set: {
                                status:status
                            }
                        },
                        { new: true }
                    )


                } else if (status === "abandoned") {
                    console.log("abandoned", status);
                    await KYCDocumentSchema.findOneAndUpdate(
                        { userId: payload?.vendorData },
                        {
                            $set: {
                                status: status
                            }
                        },
                        { new: true }
                    )


                }
                break;

            default:
                if (status === "approved") {
                    console.log("approved", status);

                    await KYCDocumentSchema.findOneAndUpdate(
                        { userId: payload?.vendorData },
                        {
                            $set: {
                                status: status
                            }
                        },
                        { new: true }
                    )



                }
                else {

                    console.log(`Verification approved - ID: ${verification?.id}`);
                }




        }
        await sendNotification({
            userId: payload?.vendorData,
            title: 'Verification Status Update',
            message: `Your verification status is status`,
            type: 'user',
            dataId: payload?.vendorData,
            linkUrl:`/vendor-dashboard/Vendor-Account`
        });
    }
)


function timestamp() {
    return new Date().toISOString();
}

async function startVerificationSession(data) {
    try {
        if (!data) {
            throw new Error('Missing required data parameter');
        }

        const payload = {
            verification: {
                person: {
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    phoneNumber: data.contact || ""
                },
                document: {
                    type: "DRIVERS_LICENSE"
                },
                vendorData: data?._id?.toString() || "",
                lang: "en",
                features: ["selfid"],
                timestamp: timestamp()
            }
        };

        const payloadStr = JSON.stringify(payload);

        if (!API_TOKEN || !API_SECRET || !API_URL) {
            throw new Error('API credentials or URL are not configured');
        }

        const headers = {
            "x-auth-client": API_TOKEN,
            "x-hmac-signature": generateSignature(payloadStr, API_SECRET),
            "content-type": "application/json"
        };

        const response = await fetch(`${API_URL}/sessions`, {
            method: "POST",
            headers,
            body: payloadStr
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error in startVerificationSession:', error);
        throw error; // Re-throw the error to let the caller handle it
    }
}
async function endVerification(verificationId) {
    const payloadObj = {
        verification: {
            frontState: "done",
            status: "submitted",
            timestamp: timestamp()
        }
    };

    const payloadStr = JSON.stringify(payloadObj);

    const headers = {
        "x-auth-client": API_TOKEN,
        "x-hmac-signature": generateSignature(payloadStr, API_SECRET),
        "content-type": "application/json"
    };

    const response = await fetch(`${API_URL}/sessions/${verificationId}`, {
        method: "PATCH",
        headers,
        body: payloadStr
    });


    return await response.json();
}




exports.uploadVeriff = uploadVeriff;
exports.VerficationComplete = VerficationComplete;