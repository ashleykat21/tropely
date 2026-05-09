import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activityRouter from "./activity";
import profilesRouter from "./profiles";
import followsRouter from "./follows";
import companionRouter from "./companion";
import notificationsRouter from "./notifications";
import pushRouter from "./push";
import tasteProfilesRouter from "./tasteProfiles";
import buddyReadsRouter from "./buddyReads";
import readingPositionsRouter from "./readingPositions";
import librarySnapshotRouter from "./librarySnapshot";
import utilitiesRouter from "./utilities";
import moodRecsRouter from "./moodRecs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activityRouter);
router.use(profilesRouter);
router.use(followsRouter);
router.use(companionRouter);
router.use(notificationsRouter);
router.use(pushRouter);
router.use(tasteProfilesRouter);
router.use(buddyReadsRouter);
router.use(readingPositionsRouter);
router.use(librarySnapshotRouter);
router.use(utilitiesRouter);
router.use(moodRecsRouter);

export default router;
