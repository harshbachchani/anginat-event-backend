import axios from "axios";

const registerPhoneNo = async (name, phoneNumber) => {
  try {
    const url = "https://api.interakt.ai/v1/public/track/users/";
    const data = {
      phoneNumber,
      countryCode: "+91",
      traits: {
        name,
      },
    };
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Basic ${process.env.WHATSAPP_API}`,
        "Content-Type": "applicaton/json",
      },
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error };
  }
};

const sendWhatsappMsg = async (phoneNumber) => {
  try {
    const url = "https://api.interakt.ai/v1/public/message/";

    const data = {
      countryCode: "+91",
      phoneNumber,
      callbackData: "some text here",
      type: "Template",
      template: {
        name: "browse_catalog_on_whatsapp",
        languageCode: "en",
        bodyValues: ["body_variable_value_1"], //the variable which I had to update
      },
    };
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Basic ${process.env.WHATSAPP_API}`,
        "Content-Type": "applicaton/json",
      },
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error };
  }
};

export { sendWhatsappMsg, registerPhoneNo };
