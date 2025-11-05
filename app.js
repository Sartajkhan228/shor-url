import { randomBytes } from 'crypto';
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = path.join("urls.json")

const ensureAsyncFunc = async () => {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2));
        console.log("Created json.file successfully")
    }
}

const readUrls = async () => {
    const data = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(data || "{}")
}

const writeUrls = async (urls) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(urls, null, 2))
}

//this api will create short code for urls
app.post("/api/shorten", async (req, res) => {

    const { url, shortCode } = req.body;
    if (!url) {
        return res.status(400).json({ error: "Url is required" });
    }

    const customCode = shortCode || randomBytes(3).toString("hex")
    const urls = await readUrls()

    // if (urls[customCode]) {
    //     return res.status(400).json({ error: "Short code already exist" })
    // }

    urls[customCode] = url
    await writeUrls(urls);

    res.json({
        message: "Short url created successfully 👇",
        shortUrl: `http://localhost:3001/${customCode}`,
        originalUrl: url
    })
});

app.get("/:shortCode", async (req, res) => {
    const { shortCode } = req.params
    const urls = await readUrls();

    const originalUrl = urls[shortCode]
    if (!originalUrl) {
        return res.status(404).send("Url not found")
    }

    res.redirect(originalUrl);
});

const PORT = 3001;
ensureAsyncFunc().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})
