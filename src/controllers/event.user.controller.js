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
    const { eventId } = req.params;
    if (!eventId) return next(new ApiError(400, "Event Id is required"));
    const profilelocalpath = req.file?.buffer;
    if (!profilelocalpath)
      return next(new ApiError(400, "Cannot get profile local path"));
    const { userName, formValues, location } = req.body;
    if (!(userName && formValues && location))
      return next(new ApiError(400, "All fields are required"));
    const eventDetail = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });
    if (!eventDetail)
      return next(
        new ApiError(400, "Cannot get eventdetails as per given eventId")
      );
    const profile = await uploadOnCloudinary(profilelocalpath);
    if (!profile)
      return next(
        new ApiError(503, "Server Error while uploading image on clodinary")
      );
    let parsedFormValues;
    try {
      parsedFormValues = JSON.parse(formValues);
    } catch (error) {
      return next(new ApiError(400, "Error in parsing JSON for Form Values"));
    }
    const userDetail = await prisma.eventRegistration.create({
      data: {
        event: { connect: { id: parseInt(eventId) } },
        profile: profile.url,
        location,
        userName,
        formValues: parsedFormValues,
        paymentStatus: "PENDING", //this can be modified further
        QR: "url", //url of the qr generated
      },
    });

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
      where: { id: userDetail.id },
      data: { QR: result.data },
    });

    //the user's phone no should be paste there
    const validatePhone = await registerPhoneNo(userName, "9057177525");

    if (!validatePhone.success) {
      return next(
        new ApiError(
          500,
          "Error while validation phone no ",
          validatePhone.error
        )
      );
    }
    console.log(validatePhone.data);
    //this would be user's phone no
    const sendmsg = await sendWhatsappMsg("9057177525");
    if (!sendmsg.success) {
      return next(
        new ApiError(500, "Error sending whatsapp message", sendmsg.error)
      );
    }
    console.log(sendmsg.data);
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
