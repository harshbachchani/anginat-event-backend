import axios from "axios";

const registerPhoneNo = async (name, email, phoneNumber) => {
  try {
    const url = "https://api.interakt.ai/v1/public/track/users/";
    const data = {
      phoneNumber,
      countryCode: "+91",
      traits: {
        name,
        email,
      },
    };
    const response = axios.post(url, data, {
      headers: {
        Authorization: `Basic ${process.env.WHATSAPP_API}`,
        "Content-Type": "applicaton/json",
      },
    });
  } catch (error) {
    return { success: false, error };
  }
};
