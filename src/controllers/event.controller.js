import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../db/config.js";
import { convertDateToIST } from "../services/dateconversion.service.js";
import {
  deletefromCloudinary,
  uploadOnCloudinary,
} from "../utils/clodinary.js";

const registerEvent = asyncHandler(async (req, res, next) => {
  try {
    const imageLocalPath = req.file?.buffer;
    if (!imageLocalPath)
      return next(new ApiError(400, "Cannot get image local path"));

    const {
      eventName,
      isPaid,
      address,
      city,
      eventDate,
      userJourney,
      eventTemplate,
      attendieType,
    } = req.body;

    if (
      !(
        eventName &&
        isPaid &&
        address &&
        city &&
        eventDate &&
        userJourney &&
        eventTemplate &&
        attendieType
      )
    )
      return next(new ApiError(400, "All fields are required"));
    if (!Date.parse(eventDate)) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (new Date(eventDate) < new Date())
      return next(
        new ApiError(400, "Event date should be greater then today'date")
      );
    // const parsedUserJourney = JSON.parse(userJourney);
    // const parsedAttendieType = JSON.parse(attendieType);
    const parsedEventTemplate = JSON.parse(eventTemplate);
    console.log(typeof userJourney);
    console.log(typeof attendieType);
    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image)
      return next(new ApiError(501, "Error on uploading image on clodinary"));
    const event = await prisma.event.create({
      data: {
        eventName,
        city,
        isPaid: Boolean(isPaid),
        address,
        eventDate: new Date(eventDate),
        userJourney,
        eventTemplate: parsedEventTemplate,
        attendieType,
        image: image.url,
        adminId: parseInt(req.user.id),
      },
    });

    if (!event) return next(new ApiError(501, "Error in creating event"));
    event.eventDate = convertDateToIST(event.eventDate);
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event Created Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const getAllCreatedEvents = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    const { status } = req.query;
    if (!user) return next(new ApiError("Cannot get User Details"));
    const events = await prisma.event.findMany({
      where: { adminId: user.id, status },
      select: {
        id: true,
        eventName: true,
        image: true,
        city: true,
        eventDate: true,
      },
    });
    if (!events) return next(new ApiError(500, "Error in fetching events "));
    for (let event of events) {
      event.eventDate = convertDateToIST(event.eventDate);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, events, "Events fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const getEventDetails = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });
    if (!event)
      return next(new ApiError(400, "Cannot get event with provided Id"));
    event.eventDate = convertDateToIST(event.eventDate);
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event details fetched successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});

const deleteEvent = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });
    if (!event) {
      return next(new ApiError(400, "Cannot get event with provided Id"));
    }
    await prisma.event.delete({ where: { id: parseInt(id) } });
    const clodinarypath = event.image;
    const result = await deletefromCloudinary([clodinarypath]);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Event deleted successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
const updateEvent = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });
    if (!event)
      return next(new ApiError(400, "Cannot get event with provided Id"));
    const imageLocalPath = req.file?.buffer;
    let imagefile = "";
    if (imageLocalPath) {
      imagefile = await uploadOnCloudinary(imageLocalPath);
      if (!imagefile.url) {
        return next(new ApiError(501, "Error while uploading on clodinary"));
      }
    }

    if (imagefile !== "") updateinfo["image"] = imagefile;
    const {
      eventName,
      isPaid,
      address,
      city,
      eventDate,
      userJourney,
      eventTemplate,
      attendieType,
    } = req.body;
    const updateinfo = {};
    if (eventName) updateinfo["eventName"] = eventName;
    if (isPaid) updateinfo["isPaid"] = isPaid;
    if (address) updateinfo["address"] = address;
    if (city) updateinfo["city"] = city;
    if (userJourney) {
      const parsedUserJourney = JSON.parse(userJourney);
      updateinfo["userJourney"] = parsedUserJourney;
    }
    if (eventTemplate) {
      const parsedEventTemplate = JSON.parse(eventTemplate);
      updateinfo["eventTemplate"] = parsedEventTemplate;
    }
    if (attendieType) {
      const parsedAttendieType = JSON.parse(attendieType);
      updateinfo["attendieType"] = parsedAttendieType;
    }
    if (eventDate) updateinfo["eventDate"] = new Date(eventDate);

    if (Object.keys(updateinfo).length === 0)
      return next(new ApiError(400, "Give atleast one of the parameters"));
    const previouseventpath = event.image;
    const updatedevent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: updateinfo,
    });
    updatedevent.eventDate = convertDateToIST(updatedevent.eventDate);
    if (imagefile !== "") {
      await deletefromCloudinary([previouseventpath]);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedevent, "Updated Successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal Server Error", error));
  }
});
export {
  registerEvent,
  getEventDetails,
  deleteEvent,
  updateEvent,
  getAllCreatedEvents,
};
