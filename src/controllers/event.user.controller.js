import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../db/config.js";
import {
  deletefromCloudinary,
  uploadOnCloudinary,
} from "../utils/clodinary.js";
import { generateQRForUser } from "../services/qrGenerator.service.js";
import { convertDateToIST } from "../services/dateconversion.service.js";
import {
  registerPhoneNo,
  sendWhatsappMsg,
} from "../services/whatsapp.service.js";

const userEventRegistration = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body);
    const { eventId } = req.params;
    if (!eventId) return next(new ApiError(400, "Event Id is required"));
    let { formValues } = req.body;
    if (!formValues)
      return next(new ApiError(400, "FormValue Field is required"));
    const eventDetail = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });
    if (!eventDetail)
      return next(
        new ApiError(400, "Cannot get eventdetails as per given eventId")
      );
    formValues = {
      "phone_input_0A6EEDDB-E0D5-4BC7-8D4B-CF2D4896B786": "9521372015",
      "email_input_A4A11559-34CB-4A95-BB86-E89C8CABE06C": "khushal@gmail.com",
      "text_input_103DC733-9828-4C8D-BDD5-E2BCDD96D92A": "Khushal Hirani",
    };

    const phoneNo =
      formValues["phone_input_0A6EEDDB-E0D5-4BC7-8D4B-CF2D4896B786"];
    const email =
      formValues["email_input_A4A11559-34CB-4A95-BB86-E89C8CABE06C"];
    const userName =
      formValues["text_input_103DC733-9828-4C8D-BDD5-E2BCDD96D92A"];
    if (!(userName && email && phoneNo))
      return next(new ApiResponse(400, "Cannot get required fields"));
    console.log(formValues);
    console.log(userName);
    console.log(phoneNo);
    console.log(email);
    console.log(typeof email);
    console.log(typeof phoneNo);
    console.log(typeof email);
    console.log(typeof formValues);
    const userDetail = await prisma.eventRegistration.create({
      data: {
        eventId: parseInt(eventId),
        userName,
        phoneNo,
        email,
        formValues: formValues,
      },
    });
    console.log(userDetail);
    if (!userDetail)
      return next(
        new ApiError(500, "Server Error while registering user to event")
      );
    const result = await generateQRForUser(userDetail, eventDetail);
    if (!result.success)
      return next(
        new ApiError(400, "Error in generating QR code for user ", result.error)
      );
    const user = await prisma.eventRegistration.update({
      where: { id: parseInt(userDetail.id) },
      data: { QR: result.data },
    });

    //the user's phone no should be paste there
    const validatePhone = await registerPhoneNo(userName, parseInt(phoneNo));

    if (!validatePhone.success) {
      return next(
        new ApiError(
          500,
          "Error while validation phone no ",
          validatePhone.error
        )
      );
    }

    //this would be user's phone no
    const whatsappData = {
      QR: result.data,
      userName: user.userName,
      name: eventDetail.eventName,
      date: eventDetail.eventDate,
      address: eventDetail.address,
      city: eventDetail.city,
    };
    const sendmsg = await sendWhatsappMsg(whatsappData, parseInt(phoneNo));
    if (!sendmsg.success) {
      return next(
        new ApiError(500, "Error sending whatsapp message", sendmsg.error)
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "User registered to the event successfully")
      );
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getAllEvents = asyncHandler(async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: "ACTIVE",
      },
    });
    if (!events)
      return next(
        new ApiError(500, "Internal Server Error while fetching events")
      );
    for (let event of events) {
      event.eventTemplate = JSON.stringify(event.eventTemplate);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, events, "Events Fetched Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getEventById = asyncHandler(async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!eventId) return next(new ApiError(400, "Event Id is required"));
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId), status: "ACTIVE" },
    });

    try {
      event.eventTemplate = JSON.stringify(event.eventTemplate);
    } catch (error) {
      return next(
        new ApiError(500, "Error Cannot parse the data to string", error)
      );
    }
    if (!event) return next(new ApiError(404, "No such event exist"));
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export { userEventRegistration, getAllEvents, getEventById };
