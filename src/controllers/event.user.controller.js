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
    const parsedFormValues = JSON.parse(formValues);

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
      select: {
        id: true,
        eventName: true,
        image: true,
        city: true,
        eventDate: true,
      },
    });
    if (!events)
      return next(
        new ApiError(500, "Internal Server Error while fetching events")
      );
    for (let event of events) {
      event.eventDate = convertDateToIST(event.eventDate);
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
    if (!event) return next(new ApiError(404, "No such event exist"));
    event.eventDate = convertDateToIST(event.eventDate);
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export { userEventRegistration, getAllEvents, getEventById };
