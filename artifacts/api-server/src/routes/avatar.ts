import { Router } from "express";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();

router.post("/avatar/upload-url", requireAuth, async (req, res) => {
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/storage/objects/*path", async (req, res) => {
  try {
    const objectPath = "/objects/" + (req.params as Record<string, string>).path;
    const file = await storage.getObjectEntityFile(objectPath);
    const response = await storage.downloadObject(file, 86400);
    const headers = Object.fromEntries(response.headers.entries());
    res.set(headers);
    const body = response.body;
    if (!body) { res.status(204).end(); return; }
    const reader = body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(value);
      pump();
    };
    pump();
  } catch (e: unknown) {
    if (e instanceof ObjectNotFoundError) { res.status(404).json({ error: "Not found" }); return; }
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
